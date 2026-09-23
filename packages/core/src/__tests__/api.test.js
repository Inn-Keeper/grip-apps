import { createApi, dateToDb, dateToUi } from "../api.js";
import { emptyTalkTrack } from "../talkTrack.js";

describe("date mapping", () => {
  it("converts ISO to DD-MM-YYYY and back", () => {
    expect(dateToUi("2026-06-11")).toBe("11-06-2026");
    expect(dateToDb("11-06-2026")).toBe("2026-06-11");
  });

  it("maps empty values to UI empty string and DB null", () => {
    expect(dateToUi(null)).toBe("");
    expect(dateToDb("")).toBeNull();
    expect(dateToDb("not-a-date")).toBeNull();
  });
});

/**
 * Minimal chainable stand-in for the Supabase client: every query resolves
 * with the table's rows, and writes are recorded for assertions.
 */
function fakeSupabase(tables = {}, authUser = null, options = {}) {
  const serverCap = options.serverCap ?? Infinity;
  const calls = { inserts: [], updates: [], deletes: [], rpcs: [], orders: [], ranges: [], selects: [] };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: authUser }, error: null }),
    },
    from(table) {
      const tableRows = tables[table] ?? [];
      const result = { data: tableRows.slice(0, serverCap), error: null };
      const query = {
        select: (columns = "*") => { calls.selects.push({ table, columns }); return query; },
        order: (column, orderOptions) => {
          calls.orders.push({ table, column, options: orderOptions });
          return query;
        },
        range: (start, end) => {
          calls.ranges.push({ table, start, end });
          result.data = tableRows.slice(start, Math.min(end + 1, start + serverCap));
          return query;
        },
        eq: (column, value) => {
          query._eq = { column, value };
          return query;
        },
        in: (column, values) => {
          query._in = { column, values };
          return query;
        },
        limit: () => query,
        maybeSingle: async () => ({ data: (tables[table] ?? [])[0] ?? null, error: null }),
        single: async () => ({ data: Array.isArray(result.data) ? result.data[0] : result.data, error: null }),
        insert: (rows) => {
          calls.inserts.push({ table, rows });
          result.data = { id: "new-id", created_at: "2026-01-01", updated_at: rows.updated_at ?? "2026-01-01", ...rows };
          return query;
        },
        update: (rows) => {
          calls.updates.push({ table, rows });
          result.data = { id: query._eq?.value ?? "existing-id", created_at: "2026-01-01", updated_at: rows.updated_at ?? "2026-01-02", ...rows };
          return query;
        },
        upsert: (rows) => {
          calls.updates.push({ table, rows });
          result.data = {
            user_id: rows.user_id,
            xp: 0,
            created_at: "2026-01-01",
            updated_at: "2026-01-02",
            ...rows,
          };
          return query;
        },
        delete: () => {
          calls.deletes.push({ table });
          return query;
        },
        then: (resolve) => resolve(result),
      };
      return query;
    },
    rpc: async (fn, args) => {
      calls.rpcs.push({ fn, args });
      return { data: null, error: null };
    },
  };
  return { client, calls };
}

describe("createApi", () => {
  it("lists board summaries without graph payloads", async () => {
    const { client, calls } = fakeSupabase({ arch_boards: [{ id: "b", title: "Board", scenario_id: "s", share_token: null, created_at: "c", updated_at: "u" }] });
    const summaries = await createApi(client).listBoardSummaries();
    expect(calls.selects.at(-1).columns).toBe("id,title,scenario_id,story_id,share_token,created_at,updated_at");
    expect(summaries[0]).toEqual({ id: "b", title: "Board", scenarioId: "s", storyId: null, shareToken: null, createdAt: "c", updatedAt: "u" });
  });

  it("gets one full board by id", async () => {
    const { client } = fakeSupabase({ arch_boards: [{ id: "b", title: "Board", scenario_id: "s", nodes: [], edges: [] }] });
    await expect(createApi(client).getBoard("b")).resolves.toMatchObject({ id: "b", scenarioId: "s", nodes: [], edges: [] });
  });
  it("aggregates answer events into per-tech scores", async () => {
    const { client } = fakeSupabase({
      profiles: [{ xp: 120 }],
      answer_events: [
        { tech: "React", correct: true },
        { tech: "React", correct: true },
        { tech: "React", correct: false },
        { tech: "Docker", correct: false },
      ],
    });
    const api = createApi(client);

    const scores = await api.getScores();
    expect(scores.xp).toBe(120);
    expect(scores.answers.React).toEqual({ correct: 2, wrong: 1 });
    expect(scores.answers.Docker).toEqual({ correct: 0, wrong: 1 });
  });

  it("defaults to zero XP when no profile row exists yet", async () => {
    const { client } = fakeSupabase({ profiles: [], answer_events: [] });
    const api = createApi(client);

    const scores = await api.getScores();
    expect(scores).toEqual({ xp: 0, answers: {} });
  });

  it("reads every score event when Supabase caps each response", async () => {
    const events = [
      { id: "1", tech: "React", correct: true, created_at: "2026-01-01T10:00:00Z" },
      { id: "2", tech: "React", correct: false, created_at: "2026-01-02T10:00:00Z" },
      { id: "3", tech: "React", correct: true, created_at: "2026-01-03T10:00:00Z" },
    ];
    const { client, calls } = fakeSupabase(
      { profiles: [], answer_events: events },
      null,
      { serverCap: 2 }
    );

    const scores = await createApi(client).getScores();

    expect(scores.answers.React).toEqual({ correct: 2, wrong: 1 });
    expect(calls.ranges).toEqual([
      { table: "answer_events", start: 0, end: 999 },
      { table: "answer_events", start: 2, end: 1001 },
      { table: "answer_events", start: 3, end: 1002 },
    ]);
    expect(calls.orders).toEqual(
      expect.arrayContaining([
        { table: "answer_events", column: "created_at", options: { ascending: true } },
        { table: "answer_events", column: "id", options: { ascending: true } },
      ])
    );
  });

  it("merges auth identity with the app profile row", async () => {
    const { client } = fakeSupabase(
      {
        profiles: [
          {
            user_id: "user-1",
            email: "profile@example.com",
            display_name: "Profile Name",
            headline: "Frontend engineer",
            target_role: "Staff Frontend Engineer",
            location: "Stockholm",
            github_url: "https://github.com/profile",
            use_github_techs_for_prep: true,
            xp: 120,
            onboarding_completed: true,
            created_at: "2026-01-01",
            updated_at: "2026-01-02",
          },
        ],
      },
      {
        id: "user-1",
        email: "auth@example.com",
        user_metadata: { full_name: "Auth Name" },
      }
    );
    const api = createApi(client);

    await expect(api.getUser()).resolves.toMatchObject({
      id: "user-1",
      displayName: "Profile Name",
      email: "auth@example.com",
      headline: "Frontend engineer",
      targetRole: "Staff Frontend Engineer",
      location: "Stockholm",
      githubUrl: "https://github.com/profile",
      useGithubTechsForPrep: true,
      xp: 120,
      onboardingCompleted: true,
    });
  });

  it("falls back to auth metadata when the profile row is missing", async () => {
    const { client } = fakeSupabase(
      { profiles: [] },
      { id: "user-1", email: "auth@example.com", user_metadata: { full_name: "Auth Name", user_name: "ada" } }
    );
    const api = createApi(client);

    await expect(api.getUser()).resolves.toMatchObject({
      id: "user-1",
      displayName: "Auth Name",
      email: "auth@example.com",
      githubUrl: "https://github.com/ada",
      useGithubTechsForPrep: false,
      xp: 0,
      onboardingCompleted: false,
    });
  });

  it("updates editable profile fields without changing auth-owned email", async () => {
    const { client, calls } = fakeSupabase(
      {},
      { id: "user-1", email: "auth@example.com", user_metadata: {} }
    );
    const api = createApi(client);

    const saved = await api.updateProfile({
      displayName: "  Ada  ",
      targetRole: "Principal Engineer",
      githubUrl: "",
      useGithubTechsForPrep: true,
      onboardingCompleted: true,
    });

    expect(calls.updates[0]).toMatchObject({
      table: "profiles",
      rows: {
        user_id: "user-1",
        email: "auth@example.com",
        display_name: "Ada",
        target_role: "Principal Engineer",
        github_url: null,
        use_github_techs_for_prep: true,
        onboarding_completed: true,
      },
    });
    expect(saved).toMatchObject({ id: "user-1", displayName: "Ada", email: "auth@example.com" });
  });

  it("lists saved boards from newest to oldest", async () => {
    const { client } = fakeSupabase({
      arch_boards: [
        {
          id: "board-1",
          title: "Payment draft",
          scenario_id: "payment",
          nodes: [{ id: "n1", type: "client", x: 0, y: 0 }],
          edges: [],
          talk_grade: 72,
          created_at: "2026-01-01",
          updated_at: "2026-01-02",
        },
      ],
    });
    const api = createApi(client);

    await expect(api.listBoards()).resolves.toEqual([
      {
        id: "board-1",
        title: "Payment draft",
        scenarioId: "payment",
        storyId: null,
        nodes: [{ id: "n1", type: "client", x: 0, y: 0 }],
        edges: [],
        talkTrack: { sections: emptyTalkTrack(), rating: null },
        talkGrade: 72,
        shareToken: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
    ]);
  });

  it("writes a board's story only when the caller sends one", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.upsertBoard({ title: "Mobile save", scenarioId: "s", nodes: [], edges: [] });
    await api.upsertBoard({ title: "Linked", scenarioId: "s", storyId: "story-1", nodes: [], edges: [] });
    await api.upsertBoard({ title: "Unlinked", scenarioId: "s", storyId: null, nodes: [], edges: [] });

    expect(calls.inserts.map(({ rows }) => rows.story_id)).toEqual([undefined, "story-1", null]);
    expect("story_id" in calls.inserts[0].rows).toBe(false);
  });

  it("round-trips a talk track through the board mapping", async () => {
    const sections = { ...emptyTalkTrack(), requirements: "Reads dominate 100:1; 99.9% availability." };
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.upsertBoard({
      title: "Catalog board",
      scenarioId: "catalog",
      nodes: [],
      edges: [],
      talkTrack: { sections, rating: 4 },
      talkGrade: 72,
    });

    expect(calls.inserts[0].rows.talk_track).toEqual({ sections, rating: 4 });
    expect(calls.inserts[0].rows.talk_grade).toBe(72);
  });

  it("normalizes a legacy board with no talk_track into blank sections", async () => {
    const { client } = fakeSupabase({
      arch_boards: [{ id: "board-1", title: "Old", scenario_id: "catalog", nodes: [], edges: [] }],
    });
    const api = createApi(client);

    const [board] = await api.listBoards();
    expect(board.talkTrack).toEqual({ sections: emptyTalkTrack(), rating: null });
    expect(board.talkGrade).toBeNull();
  });

  it("rejects an out-of-range self-rating on the way to the database", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.upsertBoard({ title: "T", scenarioId: "catalog", nodes: [], edges: [], talkTrack: { rating: 99 } });

    expect(calls.inserts[0].rows.talk_track.rating).toBeNull();
  });

  it("saves a new board snapshot", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    const board = await api.upsertBoard({
      title: "Catalog board",
      scenarioId: "catalog",
      nodes: [{ id: "n1", type: "cdn", x: 10, y: 20 }],
      edges: [],
    });

    expect(calls.inserts[0]).toMatchObject({
      table: "arch_boards",
      rows: { title: "Catalog board", scenario_id: "catalog", nodes: [{ id: "n1", type: "cdn", x: 10, y: 20 }], edges: [] },
    });
    expect(board).toMatchObject({ id: "new-id", title: "Catalog board", scenarioId: "catalog" });
  });

  it("updates an existing board snapshot", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.upsertBoard({ id: "board-1", title: "Payment v2", scenarioId: "payment", nodes: [], edges: [] });

    expect(calls.updates[0]).toMatchObject({
      table: "arch_boards",
      rows: { title: "Payment v2", scenario_id: "payment", nodes: [], edges: [] },
    });
  });

  it("returns an accuracy timeline from answer events", async () => {
    const { client } = fakeSupabase({
      answer_events: [
        { correct: true, created_at: "2026-01-01T10:00:00Z" },
        { correct: false, created_at: "2026-01-02T10:00:00Z" },
      ],
    });
    const api = createApi(client);

    await expect(api.getAccuracyTimeline()).resolves.toEqual([
      { date: "2026-01-01", accuracy: 1, correct: 1, total: 1 },
      { date: "2026-01-02", accuracy: 0.5, correct: 1, total: 2 },
    ]);
  });

  it("includes capped later events in accuracy and review calculations", async () => {
    const events = [
      { id: "1", tech: "React", correct: true, created_at: "2026-01-01T10:00:00Z" },
      { id: "2", tech: "React", correct: true, created_at: "2026-01-02T10:00:00Z" },
      { id: "3", tech: "React", correct: false, created_at: "2026-01-03T10:00:00Z" },
    ];
    const { client } = fakeSupabase({ answer_events: events }, null, { serverCap: 2 });
    const api = createApi(client);

    const timeline = await api.getAccuracyTimeline();
    const queue = await api.getReviewQueue();

    expect(timeline.at(-1)).toMatchObject({ date: "2026-01-03", correct: 2, total: 3 });
    expect(queue).toEqual([expect.objectContaining({ tech: "React", streak: 0 })]);
  });

  it("records a correct answer and XP through one retry-safe RPC", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.recordAnswer("Kubernetes", true, "drill", null, "attempt-1");
    expect(calls.inserts).toHaveLength(0);
    expect(calls.rpcs).toEqual([
      {
        fn: "record_answer",
        args: {
          p_request_id: "attempt-1",
          p_tech: "Kubernetes",
          p_correct: true,
          p_source: "drill",
          p_difficulty: null,
        },
      },
    ]);
  });

  it("records a wrong answer through the same atomic boundary", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.recordAnswer("Kubernetes", false, "card", null, "attempt-2");
    expect(calls.inserts).toHaveLength(0);
    expect(calls.rpcs).toEqual([
      {
        fn: "record_answer",
        args: {
          p_request_id: "attempt-2",
          p_tech: "Kubernetes",
          p_correct: false,
          p_source: "card",
          p_difficulty: null,
        },
      },
    ]);
  });

  it("sends the tier to the transactional answer RPC", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.recordAnswer("TypeScript", true, "drill", "ultra", "attempt-3");
    expect(calls.rpcs[0]).toEqual(
      expect.objectContaining({
        fn: "record_answer",
        args: expect.objectContaining({ p_request_id: "attempt-3", p_difficulty: "ultra" }),
      })
    );
  });

  it("resets XP and answer history for the signed-in user", async () => {
    const { client, calls } = fakeSupabase(
      {},
      { id: "user-1", email: "auth@example.com", user_metadata: {} }
    );
    const api = createApi(client);

    await expect(api.resetScores()).resolves.toEqual({ xp: 0, answers: {} });
    expect(calls.deletes).toHaveLength(0);
    expect(calls.updates).toHaveLength(0);
    expect(calls.rpcs).toEqual([{ fn: "reset_scores", args: undefined }]);
  });

  it("fetches tiered questions for the given techs", async () => {
    const rows = [
      { id: "q1", tech: "TypeScript", category: "Languages", difficulty: "mid", prompt: "p", options: ["a", "b", "c", "d"], correct: 0, explanation: null },
    ];
    const { client } = fakeSupabase({ questions: rows });
    const api = createApi(client);

    await expect(api.getQuestions({ techs: ["TypeScript"], difficulty: "mid", limit: 10 })).resolves.toEqual(rows);
  });

  it("returns no questions (and skips the query) when no techs are given", async () => {
    const { client } = fakeSupabase({ questions: [{ id: "q1" }] });
    const api = createApi(client);

    await expect(api.getQuestions({ techs: [], difficulty: "mid" })).resolves.toEqual([]);
  });

  it("round-trips posting techs and retro struggle tags on contacts", async () => {
    const { client, calls } = fakeSupabase({
      contacts: [
        {
          id: "c1",
          name: "Acme",
          status: "Interviewing",
          posting_techs: ["React", "Docker"],
          retros: [
            { id: "r1", round: "Tech round", struggled_techs: ["Docker"], date: "2026-07-01", created_at: "2026-07-01" },
          ],
        },
      ],
    });
    const api = createApi(client);

    const [contact] = await api.listContacts();
    expect(contact.postingTechs).toEqual(["React", "Docker"]);
    expect(contact.retros[0].struggledTechs).toEqual(["Docker"]);

    await api.upsertContact({ name: "Acme", status: "Interviewing", postingTechs: ["React"] });
    expect(calls.inserts[0].rows.posting_techs).toEqual(["React"]);

    await api.addRetro("c1", { round: "Round 2", struggledTechs: ["Kubernetes"] });
    expect(calls.inserts[1].rows.struggled_techs).toEqual(["Kubernetes"]);
  });

  it("builds the review queue from answer events", async () => {
    const { client } = fakeSupabase({
      answer_events: [{ tech: "React", correct: true, created_at: "2026-01-01T10:00:00Z" }],
    });
    const api = createApi(client);

    const queue = await api.getReviewQueue();
    expect(queue).toEqual([expect.objectContaining({ tech: "React", streak: 1, due: true })]);
  });

  it("toggles board sharing through the RPC and maps the token", async () => {
    const { client, calls } = fakeSupabase();
    const api = createApi(client);

    await api.setBoardSharing("board-1", true);
    expect(calls.rpcs).toEqual([{ fn: "set_board_sharing", args: { board_id: "board-1", enable: true } }]);
  });

  it("reads a shared board by token and maps it to the UI shape", async () => {
    const { client, calls } = fakeSupabase();
    client.rpc = async (fn, args) => {
      calls.rpcs.push({ fn, args });
      return {
        data: [{ title: "Payment draft", scenario_id: "payment", nodes: [], edges: [], updated_at: "2026-07-01" }],
        error: null,
      };
    };
    const api = createApi(client);

    await expect(api.getSharedBoard("token-1")).resolves.toEqual({
      title: "Payment draft",
      scenarioId: "payment",
      nodes: [],
      edges: [],
      updatedAt: "2026-07-01",
    });
    expect(calls.rpcs).toEqual([{ fn: "get_shared_board", args: { token: "token-1" } }]);
  });

  it("returns null for an unknown share token", async () => {
    const { client } = fakeSupabase();
    const api = createApi(client);

    await expect(api.getSharedBoard("nope")).resolves.toBeNull();
  });
});

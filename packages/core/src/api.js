// Data layer: Supabase queries + snake_case<->camelCase and date mapping.
// UI keeps DD-MM-YYYY strings; Postgres stores real dates.
import { buildAccuracyTimeline } from "./accuracy.js";
import { buildReviewQueue } from "./review.js";
import { normalizeTalkTrack } from "./talkTrack.js";
import { shuffle } from "./quiz.js";

// Upper bound on how many candidate questions we pull for a techs+difficulty
// fetch before randomizing. Selection happens client-side (see getQuestions),
// so this only needs to comfortably exceed a tier's pool across a few techs.
const QUESTION_FETCH_CAP = 500;

/**
 * @typedef {object} Retro
 * @property {string} id
 * @property {string} round
 * @property {string} questions
 * @property {string} wentWell
 * @property {string} toImprove
 * @property {string[]} struggledTechs
 * @property {string} date
 */

/**
 * @typedef {object} Contact
 * @property {string} [id]
 * @property {string} name
 * @property {string} status
 * @property {string} role
 * @property {string} link
 * @property {string} note
 * @property {string} date
 * @property {string} nextAction
 * @property {string} nextActionDate
 * @property {string[]} postingTechs
 * @property {Retro[]} [retros]
 */

/**
 * @typedef {object} Story
 * @property {string} [id]
 * @property {string} title
 * @property {string} competency
 * @property {string} situation
 * @property {string} task
 * @property {string} action
 * @property {string} result
 * @property {string | null} [scenarioId] Arch Board scenario (built-in key or custom uuid)
 */

/**
 * @typedef {object} Scores
 * @property {number} xp
 * @property {Record<string, { correct: number, wrong: number }>} answers
 */

/**
 * @typedef {object} AccuracyPoint
 * @property {string} date
 * @property {number} accuracy
 * @property {number} correct
 * @property {number} total
 */

/**
 * @typedef {object} SavedBoard
 * @property {string} [id]
 * @property {string} title
 * @property {string} scenarioId
 * @property {string | null} [storyId] the story this board was designed for
 * @property {import("./arch.js").BoardNode[]} nodes
 * @property {import("./arch.js").BoardEdge[]} edges
 * @property {{ sections: Record<string, string>, rating: number | null }} [talkTrack]
 * @property {number | null} [talkGrade]
 * @property {string | null} [shareToken]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {object} BoardSummary
 * @property {string} id
 * @property {string} title
 * @property {string} scenarioId
 * @property {string | null} [storyId]
 * @property {string | null} shareToken
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} displayName
 * @property {string} email
 * @property {string} avatarUrl
 * @property {string} headline
 * @property {string} targetRole
 * @property {string} location
 * @property {string} portfolioUrl
 * @property {string} githubUrl
 * @property {boolean} useGithubTechsForPrep
 * @property {string[]} cvTechs
 * @property {string} linkedinUrl
 * @property {string} timezone
 * @property {boolean} onboardingCompleted
 * @property {number} xp
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 */

/**
 * @typedef {object} SupabaseClient
 * @property {(table: string) => object} from
 * Minimal Supabase client interface for type safety
 */

export const dateToUi = (iso) => (iso ? iso.split("-").reverse().join("-") : "");
export const dateToDb = (ddmmyyyy) => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(ddmmyyyy || "");
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
};

const fail = (error) => {
  // Preserve the original Supabase error (code, details, hint) as `cause` so
  // the surfaced message isn't the only thing left for debugging.
  throw new Error(error.message, { cause: error });
};

/**
 * Binds the data layer to a Supabase client (browser or React Native).
 * @param {SupabaseClient} supabase
 * @returns {{
 *   listContacts(): Promise<Contact[]>,
 *   upsertContact(contact: Contact): Promise<void>,
 *   deleteContact(id: string | undefined): Promise<void>,
 *   addRetro(contactId: string, retro: Omit<Retro, "id" | "date"> & { date?: string }): Promise<void>,
 *   deleteRetro(id: string): Promise<void>,
 *   listStories(): Promise<Story[]>,
 *   upsertStory(story: Story): Promise<void>,
 *   deleteStory(id: string | undefined): Promise<void>,
 *   getScores(): Promise<Scores>,
 *   getAccuracyTimeline(): Promise<AccuracyPoint[]>,
 *   getReviewQueue(): Promise<import("./review.js").ReviewEntry[]>,
 *   getQuestions(args: { techs: string[], difficulty: string, limit?: number }): Promise<{ id: string, tech: string, category: string, difficulty: string, prompt: string, options: string[], correct: number, explanation: string | null }[]>,
 *   recordAnswer(tech: string, correct: boolean, source: string, difficulty: string | null, requestId: string): Promise<void>,
 *   addXp(points: number): Promise<void>,
 *   resetScores(): Promise<Scores>,
 *   listBoards(): Promise<SavedBoard[]>,
 *   listBoardSummaries(): Promise<BoardSummary[]>,
 *   getBoard(id: string): Promise<SavedBoard>,
 *   upsertBoard(board: SavedBoard): Promise<SavedBoard>,
 *   deleteBoard(id: string | undefined): Promise<void>,
 *   setBoardSharing(id: string, enable: boolean): Promise<string | null>,
 *   getSharedBoard(token: string): Promise<{ title: string, scenarioId: string, nodes: import("./arch.js").BoardNode[], edges: import("./arch.js").BoardEdge[], updatedAt: string } | null>,
 *   listCustomScenarios(): Promise<{ id: string, name: string, brief: string, budget: number, checks: object[] }[]>,
 *   upsertCustomScenario(s: object): Promise<object>,
 *   deleteCustomScenario(id: string): Promise<void>,
 *   listStatusEvents(): Promise<{ contactId: string, status: string, createdAt: string }[]>,
 *   getUser(): Promise<User | null>,
 *   updateProfile(profile: Partial<User>): Promise<User>
 * }}
 */
export function createApi(supabase) {
  // ── contacts ──────────────────────────────────────────────────────────────────

  const contactToUi = (r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    role: r.role ?? "",
    link: r.link ?? "",
    note: r.note ?? "",
    date: dateToUi(r.date),
    nextAction: r.next_action ?? "",
    nextActionDate: dateToUi(r.next_action_date),
    postingTechs: r.posting_techs ?? [],
    retros: (r.retros ?? [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((x) => ({
        id: x.id,
        round: x.round ?? "",
        questions: x.questions ?? "",
        wentWell: x.went_well ?? "",
        toImprove: x.to_improve ?? "",
        struggledTechs: x.struggled_techs ?? [],
        date: dateToUi(x.date),
      })),
  });

  const contactToDb = (c) => ({
    name: c.name,
    status: c.status,
    role: c.role || null,
    link: c.link || null,
    note: c.note || null,
    date: dateToDb(c.date),
    next_action: c.nextAction || null,
    next_action_date: dateToDb(c.nextActionDate),
    posting_techs: c.postingTechs ?? [],
  });

  async function listContacts() {
    const { data, error } = await supabase
      .from("contacts")
      .select("*, retros(*)")
      .order("created_at");
    if (error) fail(error);
    return data.map(contactToUi);
  }

  async function upsertContact(c) {
    const row = contactToDb(c);
    const q = c.id
      ? supabase.from("contacts").update(row).eq("id", c.id)
      : supabase.from("contacts").insert(row);
    const { error } = await q;
    if (error) fail(error);
  }

  async function deleteContact(id) {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) fail(error);
  }

  async function addRetro(contactId, retro) {
    const { error } = await supabase.from("retros").insert({
      contact_id: contactId,
      round: retro.round || null,
      questions: retro.questions || null,
      went_well: retro.wentWell || null,
      to_improve: retro.toImprove || null,
      struggled_techs: retro.struggledTechs ?? [],
    });
    if (error) fail(error);
  }

  async function deleteRetro(id) {
    const { error } = await supabase.from("retros").delete().eq("id", id);
    if (error) fail(error);
  }

  // ── stories ───────────────────────────────────────────────────────────────────

  const storyToUi = (r) => ({
    id: r.id,
    title: r.title,
    competency: r.competency,
    situation: r.situation ?? "",
    task: r.task ?? "",
    action: r.action ?? "",
    result: r.result ?? "",
    scenarioId: r.scenario_id ?? null,
  });

  const storyToDb = (s) => ({
    title: s.title,
    competency: s.competency,
    situation: s.situation || null,
    task: s.task || null,
    action: s.action || null,
    result: s.result || null,
    // Only when the caller knows about the link, so clients without it (mobile) don't clear it.
    ...(s.scenarioId !== undefined && { scenario_id: s.scenarioId || null }),
  });

  async function listStories() {
    const { data, error } = await supabase.from("stories").select("*").order("created_at");
    if (error) fail(error);
    return data.map(storyToUi);
  }

  async function upsertStory(s) {
    const row = storyToDb(s);
    const q = s.id
      ? supabase.from("stories").update(row).eq("id", s.id)
      : supabase.from("stories").insert(row);
    const { error } = await q;
    if (error) fail(error);
  }

  async function deleteStory(id) {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) fail(error);
  }

  // ── arch boards ───────────────────────────────────────────────────────────────

  const boardToUi = (r) => ({
    id: r.id,
    title: r.title,
    scenarioId: r.scenario_id,
    storyId: r.story_id ?? null,
    nodes: r.nodes ?? [],
    edges: r.edges ?? [],
    talkTrack: normalizeTalkTrack(r.talk_track),
    talkGrade: Number.isFinite(r.talk_grade) ? r.talk_grade : null,
    shareToken: r.share_token ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  const boardToDb = (b) => ({
    title: b.title,
    scenario_id: b.scenarioId,
    nodes: b.nodes ?? [],
    edges: b.edges ?? [],
    talk_track: normalizeTalkTrack(b.talkTrack),
    talk_grade: Number.isFinite(b.talkGrade) && b.talkGrade >= 0 && b.talkGrade <= 100
      ? Math.round(b.talkGrade)
      : null,
    // Only when the caller knows about the link, so clients without it (mobile) don't clear it.
    ...(b.storyId !== undefined && { story_id: b.storyId || null }),
  });

  const boardSummaryToUi = (r) => ({
    id: r.id,
    title: r.title,
    scenarioId: r.scenario_id,
    storyId: r.story_id ?? null,
    shareToken: r.share_token ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  async function listBoardSummaries() {
    const { data, error } = await supabase
      .from("arch_boards")
      .select("id,title,scenario_id,story_id,share_token,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) fail(error);
    return data.map(boardSummaryToUi);
  }

  async function getBoard(id) {
    const { data, error } = await supabase.from("arch_boards").select("*").eq("id", id).single();
    if (error) fail(error);
    return boardToUi(data);
  }

  async function listBoards() {
    const { data, error } = await supabase.from("arch_boards").select("*").order("updated_at", { ascending: false });
    if (error) fail(error);
    return data.map(boardToUi);
  }

  async function upsertBoard(board) {
    const row = boardToDb(board);
    const q = board.id
      ? supabase.from("arch_boards").update(row).eq("id", board.id)
      : supabase.from("arch_boards").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) fail(error);
    return boardToUi(data);
  }

  async function deleteBoard(id) {
    const { error } = await supabase.from("arch_boards").delete().eq("id", id);
    if (error) fail(error);
  }

  /**
   * Enables or revokes a board's public share link.
   * @param {string} id
   * @param {boolean} enable
   * @returns {Promise<string | null>} the share token when enabled, null when revoked
   */
  async function setBoardSharing(id, enable) {
    const { data, error } = await supabase.rpc("set_board_sharing", { board_id: id, enable });
    if (error) fail(error);
    return data ?? null;
  }

  /**
   * Reads a shared board by its token — works signed out (token-scoped RPC,
   * no open select policy on arch_boards).
   * @param {string} token
   * @returns {Promise<{ title: string, scenarioId: string, nodes: object[], edges: object[], updatedAt: string } | null>}
   */
  async function getSharedBoard(token) {
    const { data, error } = await supabase.rpc("get_shared_board", { token });
    if (error) fail(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      title: row.title,
      scenarioId: row.scenario_id,
      nodes: row.nodes ?? [],
      edges: row.edges ?? [],
      updatedAt: row.updated_at,
    };
  }

  // ── custom scenarios ──────────────────────────────────────────────────────────

  const scenarioToUi = (r) => ({
    id: r.id,
    name: r.name,
    brief: r.brief ?? "",
    budget: r.budget,
    checks: r.checks ?? [],
  });

  const scenarioToDb = (s) => ({
    name: s.name,
    brief: s.brief ?? "",
    budget: s.budget,
    checks: s.checks ?? [],
  });

  async function listCustomScenarios() {
    const { data, error } = await supabase.from("custom_scenarios").select("*").order("created_at");
    if (error) fail(error);
    return data.map(scenarioToUi);
  }

  async function upsertCustomScenario(s) {
    const row = scenarioToDb(s);
    const q = s.id
      ? supabase.from("custom_scenarios").update(row).eq("id", s.id)
      : supabase.from("custom_scenarios").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) fail(error);
    return scenarioToUi(data);
  }

  async function deleteCustomScenario(id) {
    const { error } = await supabase.from("custom_scenarios").delete().eq("id", id);
    if (error) fail(error);
  }

  /** @returns {Promise<{ contactId: string, status: string, createdAt: string }[]>} */
  async function listStatusEvents() {
    const { data, error } = await supabase
      .from("status_events")
      .select("contact_id, status, created_at")
      .order("created_at");
    if (error) fail(error);
    return data.map((row) => ({ contactId: row.contact_id, status: row.status, createdAt: row.created_at }));
  }

  // ── scores ────────────────────────────────────────────────────────────────────

  async function listAllAnswerEvents(columns) {
    const rows = [];
    let start = 0;
    while (true) {
      const { data, error } = await supabase
        .from("answer_events")
        .select(columns)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(start, start + 999);
      if (error) fail(error);
      if (!data.length) return rows;
      rows.push(...data);
      start += data.length;
    }
  }

  async function getScores() {
    const [profile, events] = await Promise.all([
      supabase.from("profiles").select("xp").maybeSingle(),
      listAllAnswerEvents("tech, correct"),
    ]);
    if (profile.error) fail(profile.error);

    const answers = {};
    for (const e of events) {
      const a = (answers[e.tech] ??= { correct: 0, wrong: 0 });
      if (e.correct) a.correct += 1;
      else a.wrong += 1;
    }
    return { xp: profile.data?.xp ?? 0, answers };
  }

  async function getAccuracyTimeline() {
    return buildAccuracyTimeline(await listAllAnswerEvents("correct, created_at"));
  }

  /** Spaced-review schedule derived from answer_events. */
  async function getReviewQueue() {
    return buildReviewQueue(
      await listAllAnswerEvents("tech, correct, created_at")
    );
  }

  /**
   * Fetches tiered quiz questions for the given techs at one difficulty.
   *
   * `limit` is the number of questions to return, not a DB truncation: we pull
   * the whole candidate pool (capped at QUESTION_FETCH_CAP), shuffle it, then
   * slice. Ordering the query alone would hand back the same first N rows every
   * call and could starve some of the requested techs; randomizing client-side
   * keeps drills varied and spread across all techs.
   * @param {{ techs: string[], difficulty: string, limit?: number }} args
   * @returns {Promise<{ id: string, tech: string, category: string, difficulty: string, prompt: string, options: string[], correct: number, explanation: string | null }[]>}
   */
  async function getQuestions({ techs, difficulty, limit = 10 }) {
    if (!techs?.length) return [];
    const { data, error } = await supabase
      .from("questions")
      .select("id, tech, category, difficulty, prompt, options, correct, explanation")
      .in("tech", techs)
      .eq("difficulty", difficulty)
      .limit(QUESTION_FETCH_CAP);
    if (error) fail(error);
    return shuffle(data).slice(0, limit);
  }

  async function recordAnswer(
    tech,
    correct,
    source = "card",
    difficulty = null,
    requestId
  ) {
    const { error } = await supabase.rpc("record_answer", {
      p_request_id: requestId,
      p_tech: tech,
      p_correct: correct,
      p_source: source,
      p_difficulty: difficulty,
    });
    if (error) fail(error);
  }

  async function addXp(points) {
    const { error } = await supabase.rpc("add_xp", { points });
    if (error) fail(error);
  }

  async function resetScores() {
    const { error } = await supabase.rpc("reset_scores");
    if (error) fail(error);

    return { xp: 0, answers: {} };
  }

  const profileToUi = (row, authUser = null) => {
    const metadata = authUser?.user_metadata ?? {};
    const githubUsername = metadata.user_name ?? metadata.preferred_username ?? "";
    return {
      id: row?.user_id ?? authUser?.id ?? "",
      displayName:
        row?.display_name ??
        metadata.display_name ??
        metadata.full_name ??
        metadata.name ??
        "",
      email: authUser?.email ?? row?.email ?? "",
      avatarUrl: row?.avatar_url ?? metadata.avatar_url ?? "",
      headline: row?.headline ?? "",
      targetRole: row?.target_role ?? "",
      location: row?.location ?? "",
      portfolioUrl: row?.portfolio_url ?? "",
      githubUrl: row?.github_url ?? (githubUsername ? `https://github.com/${githubUsername}` : ""),
      useGithubTechsForPrep: row?.use_github_techs_for_prep ?? false,
      cvTechs: row?.cv_techs ?? [],
      linkedinUrl: row?.linkedin_url ?? "",
      timezone: row?.timezone ?? "",
      onboardingCompleted: row?.onboarding_completed ?? false,
      xp: row?.xp ?? 0,
      createdAt: row?.created_at ?? null,
      updatedAt: row?.updated_at ?? null,
    };
  };

  const profileToDb = (profile) => {
    const row = {};
    const textFields = [
      ["displayName", "display_name"],
      ["avatarUrl", "avatar_url"],
      ["headline", "headline"],
      ["targetRole", "target_role"],
      ["location", "location"],
      ["portfolioUrl", "portfolio_url"],
      ["githubUrl", "github_url"],
      ["linkedinUrl", "linkedin_url"],
      ["timezone", "timezone"],
    ];
    for (const [uiKey, dbKey] of textFields) {
      if (uiKey in profile) row[dbKey] = profile[uiKey]?.trim() || null;
    }
    if ("onboardingCompleted" in profile) row.onboarding_completed = profile.onboardingCompleted ?? false;
    if ("useGithubTechsForPrep" in profile) row.use_github_techs_for_prep = profile.useGithubTechsForPrep ?? false;
    if ("cvTechs" in profile) row.cv_techs = profile.cvTechs ?? [];
    return row;
  };

  async function getUser() {
    const auth = await supabase.auth.getUser();
    if (auth.error) fail(auth.error);
    if (!auth.data.user) return null;

    const profile = await supabase.from("profiles").select("*").maybeSingle();
    if (profile.error) fail(profile.error);
    return profileToUi(profile.data, auth.data.user);
  }

  async function updateProfile(profile) {
    const auth = await supabase.auth.getUser();
    if (auth.error) fail(auth.error);
    if (!auth.data.user) throw new Error("No signed-in user.");

    const row = {
      user_id: auth.data.user.id,
      email: auth.data.user.email,
      ...profileToDb(profile),
    };
    const { data, error } = await supabase.from("profiles").upsert(row).select("*").single();
    if (error) fail(error);
    return profileToUi(data, auth.data.user);
  }

  return { listContacts, upsertContact, deleteContact, addRetro, deleteRetro, listStories, upsertStory, deleteStory, listBoards, listBoardSummaries, getBoard, upsertBoard, deleteBoard, setBoardSharing, getSharedBoard, listCustomScenarios, upsertCustomScenario, deleteCustomScenario, listStatusEvents, getScores, getAccuracyTimeline, getReviewQueue, getQuestions, recordAnswer, addXp, resetScores, getUser, updateProfile };
}

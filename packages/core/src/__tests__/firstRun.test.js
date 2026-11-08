import { cleanJobText, createPlaybookApi, needsSetup, FIRST_RUN_LIMITS, formatCvText, landingFor, playbookLabel, redactCv, savePlaybook } from "../firstRun.js";

describe("redactCv", () => {
  test("redacts email, phone, url and address", () => {
    const cv = [
      "ada@example.com | +46 (70) 123-45 67",
      "https://ada.dev and linkedin.com/in/ada",
      "Storgatan 12, Stockholm",
      "12 Baker Street",
    ].join("\n");
    const out = redactCv(cv, "");
    expect(out).not.toMatch(/example\.com|123-45|ada\.dev|linkedin|Storgatan|Baker/);
    expect(out).toContain("[email]");
    expect(out).toContain("[phone]");
    expect(out).toContain("[link]");
    expect(out).toContain("[address]");
  });

  test("redacts display name parts case-insensitively", () => {
    const out = redactCv("DALTON led the team. castro shipped it. Costa reviewed.", "Dalton Castro");
    expect(out).not.toMatch(/dalton|castro/i);
    expect(out).toContain("Costa");
    expect(out).toContain("[name]");
  });

  test("keeps company names and tech words", () => {
    expect(redactCv("Engineer at Spotify 2019-2023, React and Node.js", "Ada Lovelace")).toBe(
      "Engineer at Spotify 2019-2023, React and Node.js"
    );
  });
});

describe("landingFor", () => {
  test("maps goals to pages", () => {
    expect(landingFor("technical")).toBe("prep");
    expect(landingFor("explore")).toBe("prep");
    expect(landingFor("stories")).toBe("stories");
    expect(landingFor("design")).toBe("board");
  });
});

describe("playbookLabel", () => {
  test("prefers role over goal", () => {
    expect(playbookLabel({ role: "  Backend Engineer ", goal: "design" })).toBe("Backend Engineer");
    expect(playbookLabel({ role: "", goal: "design" })).toBe("System design");
  });
});

const playbook = {
  stories: [
    { title: "Q1", competency: "Impact", situation: "s", task: "t", action: "a", result: "r", technical: true },
    { title: "Q2", competency: "Conflict", situation: "s", task: "t", action: "a", result: "r", technical: false },
  ],
  scenario: {
    name: "Payments",
    brief: "b",
    checks: [{ kind: "edge", type: [], from: ["client"], to: ["service"], label: "L", points: 10 }],
  },
};

describe("savePlaybook", () => {
  test("links technical stories to the new scenario", async () => {
    const saved = [];
    const scenarios = [];
    const result = await savePlaybook(playbook, {
      label: "Backend Engineer",
      upsertCustomScenario: async (s) => (scenarios.push(s), { ...s, id: "sc1" }),
      upsertStory: async (s) => void saved.push(s),
    });
    expect(scenarios[0].checks[0]).toMatchObject({ kind: "edge", from: ["client"], to: ["service"] });
    // Marked so "Reset goals" can find and delete it.
    expect(scenarios[0].playbook).toBe("Backend Engineer");
    expect(saved[0]).toMatchObject({ title: "Q1", scenarioId: "sc1", isSample: true, playbook: "Backend Engineer" });
    expect(saved[1].scenarioId).toBeNull();
    expect(result).toEqual({ scenarioId: "sc1", boardId: null, saved: ["Q1", "Q2"], failed: [] });
  });

  test("retry reuses scenarioId and skips saved stories", async () => {
    let fail = true;
    const deps = {
      label: "X",
      upsertCustomScenario: jest.fn(async (s) => ({ ...s, id: "sc1" })),
      upsertStory: jest.fn(async (s) => {
        if (s.title === "Q2" && fail) throw new Error("network");
      }),
    };
    const first = await savePlaybook(playbook, deps);
    expect(first.failed).toEqual(["Q2"]);
    fail = false;
    const second = await savePlaybook(playbook, deps, first);
    expect(deps.upsertCustomScenario).toHaveBeenCalledTimes(1);
    expect(deps.upsertStory).toHaveBeenCalledTimes(3);
    expect(second).toEqual({ scenarioId: "sc1", boardId: null, saved: ["Q1", "Q2"], failed: [] });
  });
});

describe("createPlaybookApi", () => {
  afterEach(() => {
    delete global.fetch;
  });

  test("surfaces code and retryAfter", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 429,
      headers: { get: (h) => (h.toLowerCase() === "retry-after" ? "120" : null) },
      json: async () => ({ error: { code: "playbook_daily_limit", message: "Tomorrow." } }),
    }));
    const api = createPlaybookApi(async () => "tok", "https://ai.example/");
    await expect(api.generatePlaybook({ goal: "stories", stack: [] })).rejects.toMatchObject({
      code: "playbook_daily_limit",
      status: 429,
      retryAfter: 120,
      message: "Tomorrow.",
    });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe("https://ai.example/api/v1/ai/first-run/playbook");
    const sent = JSON.parse(init.body);
    expect(sent.competencies).toContain("Impact");
    expect(sent.node_types).toContain("cache");
  });

  test("limits match the API caps", () => {
    expect(FIRST_RUN_LIMITS).toEqual({ brief: 500, role: 120, jobText: 4000, cvText: 3000, notes: 3, note: 500 });
  });
});

describe("cleanJobText", () => {
  test("drops short navigation lines and duplicates so the description comes first", () => {
    const page = ["Accept", "Reject", "Sign in", "We build Europe's legal AI and need a frontend developer.", "We build Europe's legal AI and need a frontend developer.", "- Ship React and TypeScript", "Show more"].join("\n");
    expect(cleanJobText(page)).toBe("We build Europe's legal AI and need a frontend developer.\n- Ship React and TypeScript");
  });
});

describe("formatCvText", () => {
  test("turns PDF double spaces and inline bullets into lines", () => {
    expect(formatCvText("PROFILE  Senior engineer.  EXPERIENCE  Nooga - Built extensions. - Improved dashboards.")).toBe(
      "PROFILE\nSenior engineer.\nEXPERIENCE\nNooga\n- Built extensions.\n- Improved dashboards."
    );
  });
});

describe("redactCv links", () => {
  test("redacts bare domains but keeps Node.js and Next.js", () => {
    const out = redactCv("Portfolio innkeeper-forge.vercel.app, Node.js and Next.js", "");
    expect(out).toBe("Portfolio [link], Node.js and Next.js");
  });
});

describe("savePlaybook starter board", () => {
  test("creates a board with the starter components and returns its id", async () => {
    const boards = [];
    const book = { ...playbook, scenario: { ...playbook.scenario, starter: ["client", "gateway", "service"] } };
    const result = await savePlaybook(book, {
      label: "X",
      upsertCustomScenario: async (s) => ({ ...s, id: "sc1" }),
      upsertBoard: async (b) => (boards.push(b), { ...b, id: "b1" }),
      upsertStory: async () => {},
    });
    expect(boards[0]).toMatchObject({ title: "Payments", scenarioId: "sc1", storyId: null, edges: [] });
    expect(boards[0].nodes.map((n) => n.type)).toEqual(["client", "gateway", "service"]);
    expect(new Set(boards[0].nodes.map((n) => n.id)).size).toBe(3);
    expect(result.boardId).toBe("b1");
  });

  test("retry does not create a second board", async () => {
    const upsertBoard = jest.fn(async (b) => ({ ...b, id: "b1" }));
    const deps = { label: "X", upsertCustomScenario: async (s) => ({ ...s, id: "sc1" }), upsertBoard, upsertStory: async () => {} };
    const book = { ...playbook, scenario: { ...playbook.scenario, starter: ["client"] } };
    const first = await savePlaybook(book, deps);
    await savePlaybook(book, deps, first);
    expect(upsertBoard).toHaveBeenCalledTimes(1);
  });
});

describe("needsSetup", () => {
  test("true until a story carries a playbook label; unknown while loading", () => {
    expect(needsSetup(undefined)).toBe(false);
    expect(needsSetup([])).toBe(true);
    expect(needsSetup([{ playbook: null }])).toBe(true);
    expect(needsSetup([{ playbook: "Backend Engineer" }])).toBe(false);
  });
});

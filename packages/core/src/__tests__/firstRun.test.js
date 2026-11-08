import { createPlaybookApi, FIRST_RUN_LIMITS, landingFor, playbookLabel, redactCv, savePlaybook } from "../firstRun.js";

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
    expect(saved[0]).toMatchObject({ title: "Q1", scenarioId: "sc1", isSample: true, playbook: "Backend Engineer" });
    expect(saved[1].scenarioId).toBeNull();
    expect(result).toEqual({ scenarioId: "sc1", saved: ["Q1", "Q2"], failed: [] });
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
    expect(second).toEqual({ scenarioId: "sc1", saved: ["Q1", "Q2"], failed: [] });
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

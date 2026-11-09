import { cleanJobText, createPlaybookApi, needsSetup, FIRST_RUN_LIMITS, formatCvText, landingFor, playbookLabel, redactCv } from "../firstRun.js";

describe("redactCv", () => {
  test("removes redacted fields and empty separators from a contact header", () => {
    const text = "Stockholm, Sweden | +46 (70) 123-45 67 | ada@example.com https://ada.dev | linkedin.com/in/ada github.com/ada";
    expect(redactCv(text, "Ada Lovelace")).toBe("Stockholm, Sweden");
  });

  test("drops redaction-only lines and keeps experience, dates, bullets and useful separators", () => {
    const text = "Ada Lovelace\nada@example.com | +46 (70) 123-45 67\nStorgatan 12, Stockholm\nReact | TypeScript\n- Built Node.js services, 2019-2023\nLed a team of 12.";
    expect(redactCv(text, "Ada Lovelace")).toBe("React | TypeScript\n- Built Node.js services, 2019-2023\nLed a team of 12.");
  });

  test("cleans existing redaction placeholders without changing unrelated bracketed content", () => {
    expect(redactCv("Stockholm, Sweden | [phone] | [email] [link] | [link] [link]\n[name]\n[address]\nBuilt [internal] tools.", "")).toBe("Stockholm, Sweden\nBuilt [internal] tools.");
  });

  test("redacts email, phone, url and address", () => {
    const cv = [
      "ada@example.com | +46 (70) 123-45 67",
      "https://ada.dev and linkedin.com/in/ada",
      "Storgatan 12, Stockholm",
      "12 Baker Street",
    ].join("\n");
    const out = redactCv(cv, "");
    expect(out).not.toMatch(/example\.com|123-45|ada\.dev|linkedin|Storgatan|Baker/);
    expect(out).not.toMatch(/\[(?:email|phone|link|address)\]/);
  });

  test("redacts display name parts case-insensitively", () => {
    const out = redactCv("DALTON led the team. castro shipped it. Costa reviewed.", "Dalton Castro");
    expect(out).not.toMatch(/dalton|castro/i);
    expect(out).toContain("Costa");
    expect(out).toBe("led the team. shipped it. Costa reviewed.");
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
    expect(out).toBe("Portfolio, Node.js and Next.js");
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

describe("publishablePlaybook", () => {
  it("trims checks and lays out the starter board", () => {
    const { publishablePlaybook } = require("../firstRun.js");
    const out = publishablePlaybook({
      scenario: { name: "Pay", brief: "b", checks: [{ kind: "node", type: "db", label: "DB", points: 2, extra: 1 }], starter: ["api", "db"] },
      stories: [{ title: "T", competency: "c", technical: true }],
    });
    expect(out.scenario.checks).toEqual([{ kind: "node", type: "db", label: "DB", points: 2 }]);
    expect(out.board.nodes.map((n) => n.type)).toEqual(["api", "db"]);
    expect(out.stories).toHaveLength(1);
  });

  it("has no board without starter components", () => {
    const { publishablePlaybook } = require("../firstRun.js");
    expect(publishablePlaybook({ scenario: { name: "x", brief: "", checks: [] }, stories: [] }).board).toBeNull();
  });
});

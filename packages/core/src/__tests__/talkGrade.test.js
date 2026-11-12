import { FREE_SCENARIO, SCENARIOS, evaluate } from "../arch.js";
import { buildGradeFacts, createTalkGradeApi } from "../talkGrade.js";

describe("buildGradeFacts", () => {
  it("sends the scenario's figures when it has a scale block", () => {
    const scenario = SCENARIOS.find((s) => s.scale);
    const facts = buildGradeFacts(scenario, [], evaluate(scenario, [], []));
    expect(facts.dau).toBe(scenario.scale.dau);
    expect(facts.peak_qps).toBeGreaterThan(0);
  });

  it("sends no figures for a free board, only its own brief", () => {
    // Zeros would make every honest estimate look wrong to the grader.
    const scenario = { ...FREE_SCENARIO, brief: "An internal URL shortener" };
    const facts = buildGradeFacts(scenario, [{ type: "service" }, { type: "box" }], evaluate(scenario, [], []));
    expect(facts).toMatchObject({ scenario_id: "free", brief: "An internal URL shortener", node_types: ["service"] });
    expect(facts).not.toHaveProperty("dau");
    expect(facts).not.toHaveProperty("peak_qps");
  });
});

describe("createTalkGradeApi", () => {
  afterEach(() => { delete global.fetch; });
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });

  it("posts the talk track and the follow-ups to their own endpoints", async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ score: 50 }));
    const api = createTalkGradeApi(async () => "token", "http://ai/");
    await api.gradeTalkTrack({ boardId: "b1", facts: { name: "n" }, sections: { scale: "17k/s" }, selfRating: 4 });
    await api.gradeFollowups({ boardId: "b1", facts: { name: "n" }, followups: [{ question: "Why?", answer: "Because." }] });

    const [[talkUrl, talkInit], [followUrl, followInit]] = global.fetch.mock.calls;
    expect(talkUrl).toBe("http://ai/api/v1/ai/grade-talk-track");
    expect(JSON.parse(talkInit.body)).toMatchObject({ board_id: "b1", self_rating: 4, sections: { scale: "17k/s", api: "" } });
    expect(followUrl).toBe("http://ai/api/v1/ai/grade-followups");
    expect(JSON.parse(followInit.body)).toEqual({ board_id: "b1", facts: { name: "n" }, followups: [{ question: "Why?", answer: "Because." }] });
  });

  it("turns a service error body into a TalkGradeError", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: { code: "provider_busy", message: "Busy." } }) });
    const api = createTalkGradeApi(async () => "token", "http://ai");
    await expect(api.gradeFollowups({ boardId: "b1", facts: {}, followups: [] })).rejects.toMatchObject({ code: "provider_busy", status: 503 });
  });
});

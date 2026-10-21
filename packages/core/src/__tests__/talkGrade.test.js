import { FREE_SCENARIO, SCENARIOS, evaluate } from "../arch.js";
import { buildGradeFacts } from "../talkGrade.js";

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

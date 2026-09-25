import { NODE_PROBES, MAX_PUSHBACK, buildPushback } from "../pushback.js";
import { NODE_TYPES, SCENARIOS } from "../arch.js";

const scenario = SCENARIOS.find((s) => s.id === "catalog");
let nextId = 0;
const node = (type) => ({ id: `n${nextId++}`, type, x: 0, y: 0 });

describe("NODE_PROBES", () => {
  it("has follow-up questions for every palette type", () => {
    for (const spec of NODE_TYPES) {
      const probes = NODE_PROBES[spec.type];
      if (!probes?.length) throw new Error(`No probes for palette type "${spec.type}"`);
      for (const probe of probes) expect(probe.trim().endsWith("?")).toBe(true);
    }
  });

  it("does not carry probes for types that aren't in the palette", () => {
    const known = new Set(NODE_TYPES.map((t) => t.type));
    expect(Object.keys(NODE_PROBES).filter((type) => !known.has(type))).toEqual([]);
  });
});

describe("buildPushback", () => {
  it("always asks the scenario's own question, even on an empty board", () => {
    const questions = buildPushback(scenario, []);
    expect(questions).toContain(scenario.pushback);
  });

  it("probes the components actually on the board", () => {
    const questions = buildPushback(scenario, [node("cache")]);
    expect(questions.some((q) => NODE_PROBES.cache.includes(q))).toBe(true);
  });

  it("does not probe components that were never drawn", () => {
    const questions = buildPushback(scenario, [node("cache")]);
    expect(questions.some((q) => NODE_PROBES.psp.includes(q))).toBe(false);
  });

  it("asks each question once even when a type is placed twice", () => {
    const questions = buildPushback(scenario, [node("service"), node("service")]);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("caps the follow-ups so a full board isn't a wall of text", () => {
    const everything = NODE_TYPES.map((spec) => node(spec.type));
    expect(buildPushback(scenario, everything).length).toBeLessThanOrEqual(MAX_PUSHBACK);
  });

  it("keeps the scenario question when the cap trims the rest", () => {
    const everything = NODE_TYPES.map((spec) => node(spec.type));
    expect(buildPushback(scenario, everything)).toContain(scenario.pushback);
  });

  it("is deterministic — the same board asks the same questions", () => {
    const board = [node("cache"), node("sql")];
    expect(buildPushback(scenario, board)).toEqual(buildPushback(scenario, board));
  });

  it("survives a custom scenario that has no pushback of its own", () => {
    const custom = { id: "mine", name: "Mine", brief: "", budget: 10, checks: [] };
    const questions = buildPushback(custom, [node("queue")]);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => typeof q === "string" && q.trim() !== "")).toBe(true);
  });
});

describe("scenario pushback data", () => {
  it("gives all 104 scenarios their own hard prompt", () => {
    for (const s of SCENARIOS) {
      if (!s.pushback?.trim()) throw new Error(`Scenario "${s.id}" has no pushback prompt`);
      // Questions or imperatives both count — "Walk me through..." and "Prove
      // to me..." are how interviewers actually push, not just "?" endings.
      if (!/[?.]$/.test(s.pushback.trim())) {
        throw new Error(`Scenario "${s.id}" pushback is not a complete prompt: ${s.pushback}`);
      }
      // Long enough to be a real challenge rather than a stub.
      expect(s.pushback.trim().length).toBeGreaterThan(30);
    }
  });

  it("does not reuse the same question across scenarios", () => {
    const questions = SCENARIOS.map((s) => s.pushback);
    expect(new Set(questions).size).toBe(questions.length);
  });
});

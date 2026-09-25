import { SCENARIOS, SCENARIO_CATEGORIES, NODE_TYPES, buildCustomChecks, evaluate } from "../arch.js";
import { SCENARIO_SCALE } from "../scenarioScale.js";
import { ESTIMATE_TARGETS, deriveScale } from "../estimation.js";

// The scenario library is hand-authored data; these invariants are what the
// evaluator and the scenario pickers in both apps rely on.
const VALID_TYPES = new Set(NODE_TYPES.map((t) => t.type));

describe("scenario library", () => {
  it("ships exactly 104 scenarios with unique ids", () => {
    expect(SCENARIOS).toHaveLength(104);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(104);
  });

  it("assigns every scenario to a known category", () => {
    for (const s of SCENARIOS) {
      expect(SCENARIO_CATEGORIES).toContain(s.category);
    }
  });

  it("gives every scenario a name, brief, and sane budget", () => {
    for (const s of SCENARIOS) {
      expect(s.name.trim()).not.toBe("");
      expect(s.brief.trim()).not.toBe("");
      expect(Number.isInteger(s.budget)).toBe(true);
      expect(s.budget).toBeGreaterThanOrEqual(6);
      expect(s.budget).toBeLessThanOrEqual(25);
    }
  });

  it("only references palette node types in checks", () => {
    for (const s of SCENARIOS) {
      expect(s.checks.length).toBeGreaterThanOrEqual(6);
      for (const c of s.checks) {
        const referenced = c.kind === "node" ? c.type : [...c.from, ...c.to];
        expect(referenced.length).toBeGreaterThan(0);
        for (const type of referenced) {
          if (!VALID_TYPES.has(type)) {
            throw new Error(`Scenario "${s.id}" check "${c.label}" references unknown type "${type}"`);
          }
        }
        expect(c.points).toBeGreaterThan(0);
        expect(c.label.trim()).not.toBe("");
      }
    }
  });

  it("gives every scenario scale givens with sane magnitudes", () => {
    for (const s of SCENARIOS) {
      if (!s.scale) throw new Error(`Scenario "${s.id}" has no scale entry in scenarioScale.js`);
      const { dau, actionsPerUserPerDay, writesPerUserPerDay, payloadKb, retentionDays } = s.scale;
      expect(dau).toBeGreaterThan(0);
      expect(actionsPerUserPerDay).toBeGreaterThan(0);
      expect(writesPerUserPerDay).toBeGreaterThan(0);
      expect(payloadKb).toBeGreaterThan(0);
      expect(Number.isInteger(retentionDays)).toBe(true);
      expect(retentionDays).toBeGreaterThan(0);
      // A write is a request too, so it can never outnumber total requests.
      if (writesPerUserPerDay > actionsPerUserPerDay) {
        throw new Error(`Scenario "${s.id}" writes more often than it receives requests`);
      }
    }
  });

  it("has no scale rows for scenarios that no longer exist", () => {
    const ids = new Set(SCENARIOS.map((s) => s.id));
    const orphans = Object.keys(SCENARIO_SCALE).filter((id) => !ids.has(id));
    expect(orphans).toEqual([]);
  });

  it("derives estimation targets that are finite and positive for every scenario", () => {
    for (const s of SCENARIOS) {
      const derived = deriveScale(s.scale);
      for (const target of ESTIMATE_TARGETS) {
        const value = target.valueOf(derived);
        if (!Number.isFinite(value) || value <= 0) {
          throw new Error(`Scenario "${s.id}" derives a bad ${target.id}: ${value}`);
        }
      }
    }
  });

  it("scores every scenario out of exactly 100", () => {
    // Boards are compared across scenarios and stored as percentages, so the
    // denominator has to stay fixed. Adding a check means taking points from
    // another one, not growing the total.
    for (const s of SCENARIOS) {
      const total = s.checks.reduce((sum, c) => sum + c.points, 0);
      if (total !== 100) throw new Error(`Scenario "${s.id}" sums to ${total}, not 100`);
    }
  });

  it("accepts object storage where the payload is bytes, not rows", () => {
    // Drawing blob instead of a database must satisfy the storage check —
    // otherwise the correct answer for a media platform scores as a miss.
    const mediaUpload = SCENARIOS.find((s) => s.id === "media-upload");
    const storage = mediaUpload.checks.find((c) => c.kind === "edge" && c.to.includes("blob"));
    expect(storage).toBeDefined();
  });

  it("accepts an event stream where a queue was the only option before", () => {
    // Kafka-shaped answers are correct for high-throughput ingest; before the
    // palette grew, they were unexpressible and scored zero.
    for (const id of ["clickstream", "log-pipeline", "game-telemetry"]) {
      const scenario = SCENARIOS.find((s) => s.id === id);
      const accepts = scenario.checks.some((c) =>
        (c.kind === "node" ? c.type : [...c.from, ...c.to]).includes("stream")
      );
      if (!accepts) throw new Error(`Scenario "${id}" still refuses an event stream`);
    }
  });

  it("scores a stream-based ingest board the same as a queue-based one", () => {
    const clickstream = SCENARIOS.find((s) => s.id === "clickstream");
    const build = (bufferType) => {
      const nodes = [
        { id: "c", type: "client", x: 0, y: 0 },
        { id: "g", type: "gateway", x: 0, y: 0 },
        { id: "s", type: "service", x: 0, y: 0 },
        { id: "b", type: bufferType, x: 0, y: 0 },
        { id: "w", type: "worker", x: 0, y: 0 },
        { id: "d", type: "nosql", x: 0, y: 0 },
        { id: "m", type: "monitor", x: 0, y: 0 },
      ];
      const edges = [
        { id: "1", from: "c", to: "g" },
        { id: "2", from: "g", to: "s" },
        { id: "3", from: "s", to: "b" },
        { id: "4", from: "b", to: "w" },
        { id: "5", from: "w", to: "d" },
      ];
      return evaluate(clickstream, nodes, edges).score;
    };
    expect(build("stream")).toBe(build("queue"));
  });

  it("keeps warning rules callable", () => {
    const helpers = { hasNode: () => true, hasEdge: () => true };
    for (const s of SCENARIOS) {
      for (const w of s.warnings ?? []) {
        expect(typeof w.when({ ...helpers })).toBe("boolean");
        expect(w.text.trim()).not.toBe("");
      }
    }
  });
});

describe("buildCustomChecks", () => {
  it("compiles node and edge requirements with palette labels", () => {
    const checks = buildCustomChecks(["client", "cache"], [{ from: "service", to: "cache" }]);
    expect(checks).toEqual([
      { kind: "node", type: ["client"], label: "Client is part of the design", points: 33 },
      { kind: "node", type: ["cache"], label: "Cache (Redis) is part of the design", points: 33 },
      { kind: "edge", from: ["service"], to: ["cache"], label: "Service / API connects to Cache (Redis)", points: 33 },
    ]);
  });

  it("produces checks the evaluator can score", () => {
    const scenario = {
      id: "custom-test",
      name: "Custom",
      brief: "",
      budget: 10,
      checks: buildCustomChecks(["client"], [{ from: "client", to: "service" }]),
    };
    const nodes = [
      { id: "a", type: "client", x: 0, y: 0 },
      { id: "b", type: "service", x: 0, y: 0 },
    ];
    const edges = [{ id: "e1", from: "a", to: "b" }];
    const result = evaluate(scenario, nodes, edges);
    expect(result.score).toBe(100);
  });
});

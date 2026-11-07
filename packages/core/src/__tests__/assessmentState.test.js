import { applyBoardPatch, assessmentFor, gradeInputsKey, gradeStillApplies, makeAssessment, parseAssessment, topologyChanged } from "../gradeState.js";
import { commitSnapshot, createHistory, redo, undo } from "../boardHistory.js";

const node = (id, type, x = 0) => ({ id, type, x, y: 0 });
const result = { board_id: "b1", score: 70, divergence: null, suggestion: { sections: ["requirements", "scale", "api", "dataModel", "bottleneck", "tradeoff"].map((section) => ({ section, verdict: "thin", evidence: "e", gap: "g" })), hardest_followup: "f" } };
const base = {
  scenarioId: "url-shortener",
  storyId: null,
  nodes: [node("a", "client"), node("b", "service")],
  edges: [{ id: "e1", from: "a", to: "b" }],
  talkSections: { scale: "100 rps" },
  talkRating: 3,
  talkGrade: null,
  talkAssessment: null,
  brief: "",
};
const graded = { ...base, talkGrade: 70, talkAssessment: makeAssessment(base, result) };

describe("assessment invalidation", () => {
  it("keeps the topology result when only the explanation, rating or story link changes", () => {
    expect(topologyChanged(base, { ...base, talkSections: { scale: "more" } })).toBe(false);
    expect(topologyChanged(base, { ...base, storyId: "s1" })).toBe(false);
    expect(topologyChanged(base, { ...base, nodes: [node("a", "client", 99), node("b", "service")] })).toBe(false);
  });

  it("clears the topology result when the scenario, a node or an edge changes", () => {
    expect(topologyChanged(base, { ...base, scenarioId: "chat" })).toBe(true);
    expect(topologyChanged(base, { ...base, nodes: [...base.nodes, node("c", "cache")] })).toBe(true);
    expect(topologyChanged(base, { ...base, edges: [] })).toBe(true);
  });

  it("keeps the reasoning grade on a story link or node move", () => {
    expect(applyBoardPatch(graded, { storyId: "s1" }).talkGrade).toBe(70);
    expect(applyBoardPatch(graded, { nodes: [node("a", "client", 40), node("b", "service")] }).talkAssessment).not.toBeNull();
  });

  it("clears the reasoning grade when what it graded changes", () => {
    for (const patch of [{ talkSections: { scale: "edited" } }, { talkRating: 5 }, { brief: "new brief" }, { edges: [] }, { scenarioId: "chat" }]) {
      const next = applyBoardPatch(graded, patch);
      expect(next.talkGrade).toBeNull();
      expect(next.talkAssessment).toBeNull();
    }
  });

  it("restores the matching grade on undo and redo", () => {
    let history = createHistory(graded);
    history = commitSnapshot(history, applyBoardPatch(history.present, { talkSections: { scale: "edited" } }));
    expect(history.present.talkGrade).toBeNull();
    history = undo(history);
    expect(history.present.talkGrade).toBe(70);
    expect(assessmentFor(history.present)).toEqual(result);
    history = redo(history);
    expect(assessmentFor(history.present)).toBeNull();
  });
});

describe("late grading responses", () => {
  const submitted = { boardId: "b1", inputs: gradeInputsKey(base) };

  it("applies to the same board with the same inputs", () => {
    expect(gradeStillApplies(submitted, "b1", { ...base, storyId: "s9" })).toBe(true);
  });

  it("is ignored after a text edit, a board switch or an undo to different inputs", () => {
    expect(gradeStillApplies(submitted, "b1", { ...base, talkSections: { scale: "x" } })).toBe(false);
    expect(gradeStillApplies(submitted, "b2", base)).toBe(false);
    expect(gradeStillApplies(submitted, "b1", { ...base, nodes: [node("a", "client")] })).toBe(false);
  });
});

describe("persisted assessment", () => {
  it("renders only while its inputs match the document", () => {
    expect(assessmentFor(graded)).toEqual(result);
    expect(assessmentFor({ ...graded, talkSections: { scale: "changed elsewhere" } })).toBeNull();
  });

  it("ignores node key order, so web and mobile agree", () => {
    const reordered = { ...graded, nodes: graded.nodes.map(({ y, x, type, id }) => ({ y, x, type, id })) };
    expect(assessmentFor(reordered)).toEqual(result);
  });

  it("reads legacy null, malformed and unsupported payloads as no assessment", () => {
    expect(parseAssessment(null)).toBeNull();
    expect(parseAssessment({ version: 99, inputs: "x", result })).toBeNull();
    expect(parseAssessment({ version: 1, inputs: "x", result: { score: "high" } })).toBeNull();
    expect(parseAssessment("garbage")).toBeNull();
    expect(parseAssessment(graded.talkAssessment)).toEqual(graded.talkAssessment);
  });
});


it.each([
  [null],
  [{ section: "scale", verdict: "unknown", evidence: "e", gap: "g" }],
  [{ section: "unknown", verdict: "thin", evidence: "e", gap: "g" }],
  [{ section: "scale", verdict: "thin", evidence: null, gap: "g" }],
  [{ section: "scale", verdict: "thin", evidence: "e", gap: {} }],
])("rejects malformed persisted sections safely: %j", (entry) => {
  const bad = { ...graded.talkAssessment, result: { ...result, suggestion: { ...result.suggestion, sections: [entry, ...result.suggestion.sections.slice(1)] } } };
  expect(parseAssessment(bad)).toBeNull();
  expect(assessmentFor({ ...graded, talkAssessment: bad })).toBeNull();
});

it.each([-1, 101, NaN])("rejects an out-of-range assessment score: %s", (score) => {
  expect(parseAssessment({ ...graded.talkAssessment, result: { ...result, score } })).toBeNull();
});

it("rejects mismatched board identity and score when rendering an assessment", () => {
  expect(assessmentFor({ ...graded, id: "b2" })).toBeNull();
  expect(assessmentFor({ ...graded, talkGrade: 10 })).toBeNull();
  expect(parseAssessment({ ...graded.talkAssessment, result: { ...result, board_id: null } })).toBeNull();
});

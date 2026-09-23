import { gradeBlockedKey, gradeDetailFor, gradeVerdict, resumeTime } from "../gradeState.js";

describe("gradeBlockedKey", () => {
  it("blocks an unsaved board: the service takes its id", () =>
    expect(gradeBlockedKey(null, 3)).toBe("talk.gradeNeedsSave"));
  it("blocks a blank talk track: the service refuses it too", () =>
    expect(gradeBlockedKey("board-1", 0)).toBe("talk.gradeNeedsText"));
  it("allows one written section, short of the 40-char covered bar", () =>
    expect(gradeBlockedKey("board-1", 1)).toBeNull());
  it("ranks a provider limit above every local reason", () => {
    expect(gradeBlockedKey(null, 0, true)).toBe("talk.gradeLimited");
    expect(gradeBlockedKey("board-1", 3, true)).toBe("talk.gradeLimited");
  });
});

it("resumeTime adds the wait to now", () => {
  const now = Date.UTC(2026, 8, 22, 12, 0);
  expect(resumeTime(3600, now)).toBe(
    new Date(now + 3600_000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
});

describe("gradeDetailFor", () => {
  const detail = { board_id: "board-1", score: 50 };
  it("shows detail alongside the grade it produced", () =>
    expect(gradeDetailFor(50, detail, "board-1")).toBe(detail));
  it("drops it once editing clears the grade", () => expect(gradeDetailFor(null, detail, "board-1")).toBeNull());
  it("never shows another board's grade", () => expect(gradeDetailFor(50, detail, "board-2")).toBeNull());
});

describe("gradeVerdict", () => {
  const withVerdicts = (...verdicts) => ({
    suggestion: { sections: verdicts.map(([section, verdict], i) => ({ section, verdict, evidence: "", gap: `gap ${i}` })) },
  });
  const IDS = ["a", "b", "c"];

  it("is null without detail: a loaded board keeps its score, not its breakdown", () =>
    expect(gradeVerdict(null, IDS)).toBeNull());
  it("counts only the sections that earned credit", () => {
    const v = gradeVerdict(withVerdicts(["a", "covered"], ["b", "thin"], ["c", "covered"]), IDS);
    expect([v.covered, v.total]).toEqual([2, 3]);
  });
  it("picks a missing section first, even after a thin one", () =>
    expect(gradeVerdict(withVerdicts(["a", "thin"], ["b", "missing"], ["c", "covered"]), IDS).weakest.section).toBe("b"));
  it("falls back to the first thin section", () =>
    expect(gradeVerdict(withVerdicts(["a", "covered"], ["b", "thin"], ["c", "thin"]), IDS).weakest.section).toBe("b"));
  it("leaves nothing to fix when all are covered", () => {
    const v = gradeVerdict(withVerdicts(["a", "covered"], ["b", "covered"], ["c", "covered"]), IDS);
    expect(v.weakest).toBeNull();
    expect(v.covered).toBe(3);
  });
});

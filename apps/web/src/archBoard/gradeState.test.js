import assert from "node:assert/strict";
import { test } from "node:test";
import { gradeBlockedKey, gradeDetailFor, resumeTime } from "./gradeState.js";

test("an unsaved board cannot be graded: the service takes its id", () => {
  assert.equal(gradeBlockedKey(null, 3), "talk.gradeNeedsSave");
});

test("a blank talk track cannot be graded: the service refuses it too", () => {
  assert.equal(gradeBlockedKey("board-1", 0), "talk.gradeNeedsText");
});

test("one written section is enough, short of the 40-char covered bar", () => {
  assert.equal(gradeBlockedKey("board-1", 1), null);
});

test("a provider limit outranks every local reason, which cannot clear it", () => {
  assert.equal(gradeBlockedKey(null, 0, true), "talk.gradeLimited");
  assert.equal(gradeBlockedKey("board-1", 3, true), "talk.gradeLimited");
});

test("the resume time is the wait added to now", () => {
  const now = Date.UTC(2026, 8, 22, 12, 0);
  assert.equal(resumeTime(3600, now), new Date(now + 3600_000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
});

const detail = { board_id: "board-1", score: 50 };

test("detail shows alongside the grade it produced", () => {
  assert.equal(gradeDetailFor(50, detail, "board-1"), detail);
});

test("editing clears the grade, which retires the verdicts with it", () => {
  assert.equal(gradeDetailFor(null, detail, "board-1"), null);
});

test("another board's grade is never shown on this one", () => {
  assert.equal(gradeDetailFor(50, detail, "board-2"), null);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { primaryActionKind } from "./primaryAction.js";

test("a saved board to resume wins over the workflow step", () => {
  assert.equal(primaryActionKind({ hasLatestBoard: true, hasWeakest: true, explaining: true }), "continue");
});

test("a weak section beats writing the talk track", () => {
  assert.equal(primaryActionKind({ hasLatestBoard: false, hasWeakest: true, explaining: true }), "answer");
});

test("explaining offers the talk track, otherwise evaluate", () => {
  assert.equal(primaryActionKind({ hasLatestBoard: false, hasWeakest: false, explaining: true }), "explain");
  assert.equal(primaryActionKind({ hasLatestBoard: false, hasWeakest: false, explaining: false }), "evaluate");
});

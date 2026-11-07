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

test("an empty scored board offers to add a component, not a disabled Evaluate", () => {
  assert.equal(primaryActionKind({ hasLatestBoard: false, hasWeakest: false, explaining: false, empty: true }), "add");
});

test("a latest saved board still wins on an empty canvas", () => {
  assert.equal(primaryActionKind({ hasLatestBoard: true, hasWeakest: false, explaining: false, empty: true }), "continue");
});

test("a free board keeps its unscored behavior when empty", () => {
  assert.notEqual(primaryActionKind({ hasLatestBoard: false, hasWeakest: false, explaining: false, empty: true, free: true }), "add");
});

test("a diagram with nodes keeps the evaluation path", () => {
  assert.equal(primaryActionKind({ hasLatestBoard: false, hasWeakest: false, explaining: false, empty: false }), "evaluate");
});

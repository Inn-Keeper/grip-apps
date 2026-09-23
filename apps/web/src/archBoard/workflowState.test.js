import assert from "node:assert/strict";
import { test } from "node:test";
import { stepState, workflowStep } from "./workflowState.js";

test("starts by asking for components", () => {
  assert.equal(workflowStep(0, 0), 1);
});

test("asks for a connection once components exist", () => {
  assert.equal(workflowStep(2, 0), 2);
});

test("asks for arrow details after a connection exists", () => {
  assert.equal(workflowStep(2, 1), 3);
});

test("asks for the talk track once the design has been evaluated", () => {
  assert.equal(workflowStep(2, 1, true), 4);
});

test("the last step is reached only once a grade exists", () => {
  assert.equal(workflowStep(2, 1, true, true), 5);
});

test("evaluating early does not skip the drawing steps", () => {
  assert.equal(workflowStep(0, 0, true, true), 1);
  assert.equal(workflowStep(2, 0, true, true), 2);
});

test("a finished step reads as done, not as gone", () => {
  assert.equal(stepState(1, 3), "done");
  assert.equal(stepState(3, 3), "current");
  assert.equal(stepState(4, 3), "todo");
});

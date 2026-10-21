import assert from "node:assert/strict";
import { test } from "node:test";
import { commitSnapshot, createHistory, redo, sameSnapshot, undo } from "@grip/core/boardHistory";

const snapshot = (nodes = [], edges = []) => ({
  scenarioId: "scenario",
  nodes,
  edges,
  talkSections: {},
  talkRating: null,
  talkGrade: null,
});

test("undo restores nodes and incident edges together", () => {
  const original = snapshot([{ id: "a" }, { id: "b" }], [{ id: "e", from: "a", to: "b" }]);
  const changed = snapshot([{ id: "b" }], []);
  const history = commitSnapshot(createHistory(original), changed);

  assert.deepEqual(undo(history).present, original);
  assert.deepEqual(redo(undo(history)).present, changed);
});

test("a new edit after undo discards redo", () => {
  const history = commitSnapshot(commitSnapshot(createHistory(snapshot()), snapshot([{ id: "a" }])), snapshot([{ id: "b" }]));
  const edited = commitSnapshot(undo(history), snapshot([{ id: "c" }]));
  assert.equal(edited.future.length, 0);
});

test("history retains at most fifty prior snapshots", () => {
  let history = createHistory(snapshot());
  for (let i = 0; i < 60; i += 1) history = commitSnapshot(history, snapshot([{ id: String(i) }]));
  assert.equal(history.past.length, 50);
});

test("equal snapshots ignore object identity", () => {
  assert.equal(sameSnapshot(snapshot([{ id: "a" }]), snapshot([{ id: "a" }])), true);
  assert.equal(sameSnapshot(snapshot(), snapshot([{ id: "a" }])), false);
});


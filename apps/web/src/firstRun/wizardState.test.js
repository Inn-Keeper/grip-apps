import assert from "node:assert/strict";
import test from "node:test";
import { canContinue, initialWizard, playbookRequest, profileUpdate, wizardReducer } from "./wizardState.js";

const profile = { favoriteTechs: ["React", "SQL"], targetRole: "Backend Engineer" };
const run = (state, ...actions) => actions.reduce(wizardReducer, state);

test("prefills stack and role from profile", () => {
  const state = initialWizard(profile);
  assert.deepEqual(state.stack, ["React", "SQL"]);
  assert.equal(state.role, "Backend Engineer");
  assert.equal(state.step, "stack");
});

test("goal step blocks continue until a goal is chosen", () => {
  const atGoal = run(initialWizard(null), { type: "next" });
  assert.equal(atGoal.step, "goal");
  assert.equal(canContinue(atGoal), false);
  assert.equal(canContinue(run(atGoal, { type: "setGoal", goal: "design" })), true);
});

test("skip on role moves to experience and keeps entered fields", () => {
  const state = run(
    initialWizard(profile),
    { type: "next" },
    { type: "setGoal", goal: "stories" },
    { type: "next" },
    { type: "setField", field: "jobText", value: "We need Go" },
    { type: "skip" },
  );
  assert.equal(state.step, "experience");
  assert.equal(state.jobText, "We need Go");
});

test("back preserves inputs", () => {
  const state = run(initialWizard(null), { type: "toggleTech", tech: "Go" }, { type: "next" }, { type: "back" });
  assert.equal(state.step, "stack");
  assert.deepEqual(state.stack, ["Go"]);
});

test("toggleTech removes a selected tech", () => {
  const state = run(initialWizard(profile), { type: "toggleTech", tech: "React" });
  assert.deepEqual(state.stack, ["SQL"]);
});

test("goTo from review returns to the chosen step", () => {
  const state = run(initialWizard(profile), { type: "goTo", step: "review" }, { type: "goTo", step: "role" });
  assert.equal(state.step, "role");
});

test("setNote edits one note", () => {
  const state = run(initialWizard(null), { type: "setNote", index: 1, value: "Led a migration" });
  assert.deepEqual(state.notes, ["", "Led a migration", ""]);
});

test("profile update before generating never marks setup done", () => {
  const update = profileUpdate(initialWizard(profile));
  assert.deepEqual(update, { favoriteTechs: ["React", "SQL"], targetRole: "Backend Engineer" });
});

test("playbook request respects the API caps", () => {
  const state = { ...initialWizard({ favoriteTechs: Array.from({ length: 40 }, (_, i) => `T${i}`), targetRole: "x".repeat(200) }), goal: "stories" };
  const req = playbookRequest(state, "pt");
  assert.equal(req.stack.length, 30);
  assert.equal(req.role.length, 120);
  assert.equal(req.locale, "pt");
  assert.deepEqual(req.notes, []);
});

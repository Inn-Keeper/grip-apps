import assert from "node:assert/strict";
import test from "node:test";
import { canContinue, initialWizard, playbookRequest, prepPlanTechs, preparationSave, profileUpdate, resumeDraft, wizardReducer } from "./wizardState.js";

const profile = { goalTechs: ["React", "SQL"], targetRole: "Backend Engineer" };
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
  const update = profileUpdate({ ...initialWizard(profile), jobTechs: ["Python", "SQL"] });
  // Goals are the wizard's own list; Favorites stay the user's to edit in Profile.
  assert.deepEqual(update, { goalTechs: ["React", "SQL", "Python"], targetRole: "Backend Engineer" });
});

test("playbook request respects the API caps", () => {
  const state = { ...initialWizard({ favoriteTechs: Array.from({ length: 40 }, (_, i) => `T${i}`), targetRole: "x".repeat(200) }), goal: "stories" };
  const req = playbookRequest(state, "pt");
  assert.equal(req.stack.length, 30);
  assert.equal(req.role.length, 120);
  assert.equal(req.locale, "pt");
  assert.deepEqual(req.notes, []);
});

test("prep plan techs put the stack first, then the role's techs, once each", () => {
  const state = { ...initialWizard(profile), jobTechs: ["React", "Python", "SQL"] };
  assert.deepEqual(prepPlanTechs(state), ["React", "SQL", "Python"]);
});

test("the wizard saves preparation without touching favourites or CV detections", () => {
  const state = { ...initialWizard({ favoriteTechs: ["rust"], cvTechs: ["go"], targetRole: "SRE" }), stack: ["go"], jobTechs: ["kafka"], goal: "design", brief: " pay " };
  assert.deepEqual(preparationSave(state, { favoriteTechs: ["rust"], cvTechs: ["go"] }), {
    profilePatch: { targetRole: "SRE", goalTechs: ["go", "kafka"], favoriteTechs: ["rust"], cvTechs: ["go"] },
    goal: "design",
    brief: "pay",
  });
});

test("an unchosen goal saves as explore", () => {
  assert.equal(preparationSave(initialWizard(null), null).goal, "explore");
});

test("resumeDraft resumes only the owner's draft and never mid-generate", () => {
  const me = { ...profile, id: "u1" };
  const saved = (userId, step) => JSON.stringify({ userId, state: { ...initialWizard(me), step } });
  assert.equal(resumeDraft(saved("u1", "role"), me).step, "role");
  assert.equal(resumeDraft(saved("u1", "generate"), me).step, "review");
  assert.equal(resumeDraft(saved("u2", "role"), me).step, "stack");
  assert.equal(resumeDraft("not json", me).step, "stack");
  assert.equal(resumeDraft(null, me).step, "stack");
  assert.equal(resumeDraft(saved("u1", "role"), null).step, "stack");
});

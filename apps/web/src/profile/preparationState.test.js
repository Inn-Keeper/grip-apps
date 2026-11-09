import assert from "node:assert/strict";
import test from "node:test";
import {
  addTech,
  createPreparationDraft,
  isDraftDirty,
  playbookStatus,
  preparationPatch,
  snapshotFor,
} from "./preparationState.js";

const profile = { targetRole: "SRE", goalTechs: ["go", "k8s"], favoriteTechs: ["rust"], cvTechs: ["go"] };
const prep = { goal: "design", brief: "payments", githubTechs: [], githubSyncedAt: null, activePlaybook: null };

test("a draft never shares arrays with the saved profile", () => {
  const draft = createPreparationDraft(profile, prep);
  draft.techs.push("x");
  draft.favoriteTechs.push("y");
  assert.deepEqual(profile.goalTechs, ["go", "k8s"]);
  assert.deepEqual(profile.favoriteTechs, ["rust"]);
});

test("draft defaults when nothing is saved", () => {
  assert.deepEqual(createPreparationDraft(null, null), { role: "", goal: "explore", brief: "", techs: [], favoriteTechs: [], cvTechs: [] });
});

test("a discarded draft is not dirty; edits are", () => {
  const draft = createPreparationDraft(profile, prep);
  assert.equal(isDraftDirty(draft, profile, prep), false);
  assert.equal(isDraftDirty({ ...draft, techs: ["k8s", "go"] }, profile, prep), false); // order only
  assert.equal(isDraftDirty({ ...draft, brief: "x" }, profile, prep), true);
});

test("the patch keeps favourites outside the stack", () => {
  const patch = preparationPatch(createPreparationDraft(profile, prep));
  assert.deepEqual(patch.profilePatch, { targetRole: "SRE", goalTechs: ["go", "k8s"], favoriteTechs: ["rust"], cvTechs: ["go"] });
  assert.equal(patch.goal, "design");
});

test("custom technologies are kept, trimmed and deduplicated", () => {
  assert.deepEqual(addTech(["go"], "  Elixir "), ["go", "Elixir"]);
  assert.deepEqual(addTech(["go"], "GO"), ["go"]);
  assert.deepEqual(addTech(["go"], "  "), ["go"]);
});

test("snapshots are canonical: order and duplicates do not matter", () => {
  const a = snapshotFor(profile, prep, "en");
  const b = snapshotFor({ ...profile, goalTechs: ["k8s", "go", "go"] }, prep, "en");
  assert.deepEqual(a, b);
  assert.deepEqual(a, { version: 1, role: "SRE", goal: "design", brief: "payments", techs: ["go", "k8s"], favoriteTechs: ["rust"], locale: "en" });
});

test("an empty stack still snapshots", () => {
  assert.deepEqual(snapshotFor({}, null, "sv").techs, []);
});

test("playbook lifecycle states", () => {
  const snapshot = snapshotFor(profile, prep, "en");
  const active = { generationId: "g", snapshot };
  assert.equal(playbookStatus({ active: null, snapshot }), "none");
  assert.equal(playbookStatus({ active: null, snapshot, hasLegacy: true }), "legacy");
  assert.equal(playbookStatus({ active, snapshot }), "current");
  assert.equal(playbookStatus({ active, snapshot: snapshotFor(profile, prep, "pt") }), "changed");
  assert.equal(playbookStatus({ active, snapshot: snapshotFor({ ...profile, favoriteTechs: [] }, prep, "en") }), "changed");
  assert.equal(playbookStatus({ active, snapshot, phase: "generating" }), "generating");
  assert.equal(playbookStatus({ active, snapshot, phase: "failed" }), "failed");
  assert.equal(playbookStatus({ active, snapshot, phase: "interrupted" }), "interrupted");
});

test("a manifest without a snapshot is legacy, never current", () => {
  assert.equal(playbookStatus({ active: { generationId: "g" }, snapshot: snapshotFor(profile, prep, "en") }), "legacy");
});

import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowWizard, wizardUndecided } from "./gating.js";

const session = { user: { is_anonymous: false } };
const fresh = { onboardingCompleted: false };

test("anonymous demo session gets the wizard like everyone", () => {
  assert.equal(shouldShowWizard({ session: { user: { is_anonymous: true } }, profile: fresh, openedManually: false }), true);
});

test("shows for a signed-in user with onboardingCompleted false", () => {
  assert.equal(shouldShowWizard({ session, profile: fresh, openedManually: false }), true);
});

test("hidden while profile is loading", () => {
  assert.equal(shouldShowWizard({ session, profile: undefined, openedManually: false }), false);
});

test("hidden once completed", () => {
  assert.equal(shouldShowWizard({ session, profile: { onboardingCompleted: true }, openedManually: false }), false);
});

test("manual open shows even when completed", () => {
  assert.equal(shouldShowWizard({ session, profile: { onboardingCompleted: true }, openedManually: true }), true);
});

test("signed out never sees it", () => {
  assert.equal(shouldShowWizard({ session: null, profile: fresh, openedManually: true }), false);
});

test("a missing profile row counts as not completed", () => {
  assert.equal(shouldShowWizard({ session, profile: null, openedManually: false }), true);
});

test("the wizard decision waits for the profile, so pages do not flash first", () => {
  assert.equal(wizardUndecided({ session, profile: undefined, openedManually: false }), true);
  assert.equal(wizardUndecided({ session, profile: null, openedManually: false }), false);
  assert.equal(wizardUndecided({ session, profile: { onboardingCompleted: true }, openedManually: false }), false);
  assert.equal(wizardUndecided({ session: null, profile: undefined, openedManually: false }), false);
  assert.equal(wizardUndecided({ session, profile: undefined, openedManually: true }), false);
});

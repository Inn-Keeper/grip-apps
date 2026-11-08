import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowWizard } from "./gating.js";

const session = { user: { is_anonymous: false } };
const fresh = { onboardingCompleted: false };

test("anonymous demo session never sees the wizard", () => {
  assert.equal(shouldShowWizard({ session: { user: { is_anonymous: true } }, profile: fresh, openedManually: false }), false);
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

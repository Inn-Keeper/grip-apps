import assert from "node:assert/strict";
import { test } from "node:test";
import { hasStageTransitions, velocityEmptyKey } from "./velocityState.js";

test("no events at all is no transition", () => {
  assert.equal(hasStageTransitions([]), false);
  assert.equal(hasStageTransitions(), false);
});

test("one event per contact is no transition: a single event has no dwell interval", () => {
  const events = [{ contactId: "a" }, { contactId: "b" }, { contactId: "c" }];
  assert.equal(hasStageTransitions(events), false);
});

test("a second event for the same contact is a transition", () => {
  assert.equal(hasStageTransitions([{ contactId: "a" }, { contactId: "a" }]), true);
});

test("the repeat is found even when other contacts sit between the two events", () => {
  const events = [{ contactId: "a" }, { contactId: "b" }, { contactId: "a" }];
  assert.equal(hasStageTransitions(events), true);
});

test("empty with nothing to average tells the user how to fill it", () => {
  assert.equal(velocityEmptyKey([{ contactId: "a" }]), "quest.velocityEmpty");
});

test("empty despite recorded transitions points at the service, not the user", () => {
  const events = [{ contactId: "a" }, { contactId: "a" }];
  assert.equal(velocityEmptyKey(events), "quest.velocityNoAverages");
});

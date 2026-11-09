import assert from "node:assert/strict";
import test from "node:test";
import { clearAttempt, orderedTechs, preparationRequest, readAttempt, writeAttempt } from "./playbookState.js";

const snapshot = { version: 1, role: "SRE", goal: "design", brief: "b", techs: ["go", "k8s", "rust"], favoriteTechs: ["rust", "Elixir", "Kafka"], locale: "en" };

test("preferred techs go first, then the rest of the stack, deduplicated", () => {
  assert.deepEqual(orderedTechs(snapshot, ["go", "k8s", "rust", "Kafka"]), ["rust", "Kafka", "go", "k8s"]);
});

test("unsupported favourites outside the stack are not sent", () => {
  assert.ok(!orderedTechs(snapshot, ["go"]).includes("Elixir"));
});

test("the request respects the 30-tech cap", () => {
  const big = { ...snapshot, techs: Array.from({ length: 40 }, (_, i) => `t${i}`), favoriteTechs: [] };
  assert.equal(preparationRequest(big, []).stack.length, 30);
});

test("the request carries no private context", () => {
  const request = preparationRequest(snapshot, []);
  assert.equal(request.job_text, "");
  assert.equal(request.cv_text, "");
  assert.deepEqual(request.notes, []);
  assert.equal(request.goal, "design");
  assert.equal(request.locale, "en");
});

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
}

test("attempt markers are per account and hold no playbook content", () => {
  const storage = memoryStorage();
  writeAttempt(storage, "u1", { id: "g1", startedAt: "t" });
  assert.deepEqual(readAttempt(storage, "u1"), { id: "g1", startedAt: "t" });
  assert.equal(readAttempt(storage, "u2"), null);
  clearAttempt(storage, "u1");
  assert.equal(readAttempt(storage, "u1"), null);
});

test("a corrupt marker reads as none", () => {
  const storage = memoryStorage();
  storage.setItem("grip.playbookAttempt.u1", "{nope");
  assert.equal(readAttempt(storage, "u1"), null);
});

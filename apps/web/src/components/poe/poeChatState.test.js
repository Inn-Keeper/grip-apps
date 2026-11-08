import { test } from "node:test";
import assert from "node:assert/strict";
import { canSend, isUnavailable } from "./poeChatState.js";

test("canSend", () => {
  assert.equal(canSend("  ", false), false);
  assert.equal(canSend("hi", true), false); // in flight: no double send
  assert.equal(canSend("x".repeat(501), false), false);
  assert.equal(canSend("Where do I start?", false), true);
});

test("isUnavailable", () => {
  assert.equal(isUnavailable({ code: "poe_unavailable" }), true);
  assert.equal(isUnavailable({ code: "busy" }), false);
  assert.equal(isUnavailable(null), false);
});

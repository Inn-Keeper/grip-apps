import assert from "node:assert/strict";
import test from "node:test";
import { shouldReloadForStaleChunk } from "./staleChunk.js";

test("a missing chunk reloads once, but not again right after that reload", () => {
  const now = 1_000_000;
  assert.equal(shouldReloadForStaleChunk(null, now), true);
  assert.equal(shouldReloadForStaleChunk(now - 5_000, now), false);
  assert.equal(shouldReloadForStaleChunk(now - 60_000, now), true);
});

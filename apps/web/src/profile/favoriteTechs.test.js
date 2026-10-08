import assert from "node:assert/strict";
import test from "node:test";
import { toggleFavoriteTech } from "./favoriteTechs.js";

test("toggleFavoriteTech adds a missing favorite and removes an existing one", () => {
  assert.deepEqual(toggleFavoriteTech(["React"], "Python"), ["React", "Python"]);
  assert.deepEqual(toggleFavoriteTech(["React", "Python"], "React"), ["Python"]);
});

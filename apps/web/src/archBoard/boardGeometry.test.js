import assert from "node:assert/strict";
import { test } from "node:test";
import { findPlacement } from "./boardGeometry.js";

const size = { width: 132, height: 54 };

test("placement stays visible in narrow viewports", () => {
  const point = findPlacement([], { width: 320, height: 560 }, size);
  assert.ok(point.x >= 0 && point.x + size.width <= 320);
});

test("placement scans for the first free cell", () => {
  const nodes = [{ x: 30, y: 30 }, { x: 185, y: 30 }];
  assert.deepEqual(findPlacement(nodes, { width: 480, height: 560 }, size), { x: 30, y: 125 });
});

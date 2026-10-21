import assert from "node:assert/strict";
import { test } from "node:test";
import { findPlacement } from "@grip/core/arch";
import { nodeAxisPoint } from "./boardGeometry.js";

const size = { width: 132, height: 54 };

test("placement stays visible in narrow viewports", () => {
  const point = findPlacement([], { width: 320, height: 560 }, size);
  assert.ok(point.x >= 0 && point.x + size.width <= 320);
});

test("placement scans for the first free cell", () => {
  const nodes = [{ x: 30, y: 30 }, { x: 185, y: 30 }];
  assert.deepEqual(findPlacement(nodes, { width: 480, height: 560 }, size), { x: 30, y: 125 });
});

test("placement steps past a node that was resized bigger than a card", () => {
  const big = { x: 30, y: 30, w: 300 };
  const point = findPlacement([big], { width: 800, height: 560 }, size, (n) => ({ width: n.w ?? size.width, height: size.height }));
  assert.ok(point.x >= 330 || point.y > 30);
});

test("a drag leaves from the side facing the pointer, top and bottom included", () => {
  const node = { x: 0, y: 0 };
  const card = { width: 100, height: 40 };
  assert.deepEqual(nodeAxisPoint(node, { x: 300, y: 20 }, card), { x: 100, y: 20 });
  assert.deepEqual(nodeAxisPoint(node, { x: -200, y: 20 }, card), { x: 0, y: 20 });
  assert.deepEqual(nodeAxisPoint(node, { x: 50, y: 200 }, card), { x: 50, y: 40 });
  assert.deepEqual(nodeAxisPoint(node, { x: 60, y: -150 }, card), { x: 50, y: 0 });
});

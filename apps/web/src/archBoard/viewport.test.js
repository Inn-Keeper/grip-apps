import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_SCALE, fitView, nextZoomStop, normalizeWheel, screenToBoard, wheelZoomFactor, zoomAt } from "./viewport.js";

test("zooming keeps the board point under the anchor fixed", () => {
  const view = { scale: 1, x: 30, y: -20 };
  const anchor = { x: 200, y: 150 };
  const before = screenToBoard(view, anchor);
  const after = screenToBoard(zoomAt(view, anchor, 1.5), anchor);
  assert.ok(Math.abs(before.x - after.x) < 1e-9 && Math.abs(before.y - after.y) < 1e-9);
});

test("zoom is clamped to the allowed range", () => {
  assert.equal(zoomAt({ scale: 1.9, x: 0, y: 0 }, { x: 0, y: 0 }, 10).scale, MAX_SCALE);
});

test("wheel zoom direction and clamping", () => {
  assert.ok(wheelZoomFactor(-5) > 1);
  assert.ok(wheelZoomFactor(5) < 1);
  assert.equal(wheelZoomFactor(10_000), wheelZoomFactor(100));
});

test("line-mode wheel deltas become pixels", () => {
  assert.deepEqual(normalizeWheel(1, 3, 1, { width: 800, height: 600 }), { dx: 16, dy: 48 });
});

test("zoom buttons step through ten-percent stops", () => {
  assert.equal(nextZoomStop(100, 1), 110);
  assert.equal(nextZoomStop(100, -1), 90);
  assert.equal(nextZoomStop(83, 1), 90);
  assert.equal(nextZoomStop(99.8, 1), 110);
  assert.equal(nextZoomStop(25, -1), 25);
});

test("fit centers the nodes and never enlarges small boards", () => {
  const view = fitView([{ x: 100, y: 100 }], { width: 800, height: 600 }, { width: 100, height: 50 });
  assert.equal(view.scale, 1);
  assert.deepEqual(screenToBoard(view, { x: 400, y: 300 }), { x: 150, y: 125 });
});

test("fit shrinks wide boards to the viewport", () => {
  const view = fitView([{ x: 0, y: 0 }, { x: 1900, y: 0 }], { width: 800, height: 600 }, { width: 100, height: 50 });
  assert.ok(view.scale < 1);
});

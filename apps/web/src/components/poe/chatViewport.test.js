import { test } from "node:test";
import assert from "node:assert/strict";
import { measureChatViewport } from "./chatViewport.js";

test("chat follows a keyboard that shrinks only the visual viewport", () => {
  assert.deepEqual(measureChatViewport({ height: 480, offsetTop: 0 }, 812), { height: 480, bottom: 332 });
});

test("visual viewport panning and keyboard dismissal keep the inset accurate", () => {
  assert.deepEqual(measureChatViewport({ height: 480, offsetTop: 100 }, 812), { height: 480, bottom: 232 });
  assert.deepEqual(measureChatViewport({ height: 812, offsetTop: 0 }, 812), { height: 812, bottom: 0 });
  assert.deepEqual(measureChatViewport({ height: 812, offsetTop: 20 }, 812), { height: 812, bottom: 0 });
});

test("browsers without visualViewport use the layout viewport", () => {
  assert.deepEqual(measureChatViewport(null, 812), { height: 812, bottom: 0 });
});

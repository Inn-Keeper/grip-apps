import assert from "node:assert/strict";
import { test } from "node:test";
import { styleShortcut } from "./freeStyle.js";

const key = (code, mods = {}) => ({ code, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...mods });
const style = { size: "m", color: "text", align: "left", bold: false };

test("size steps stop at both ends instead of wrapping", () => {
  assert.deepEqual(styleShortcut(key("Period", { metaKey: true, shiftKey: true }), style), { size: "l" });
  assert.deepEqual(styleShortcut(key("Period", { ctrlKey: true, shiftKey: true }), { ...style, size: "xl" }), {});
  assert.deepEqual(styleShortcut(key("Comma", { ctrlKey: true, shiftKey: true }), { ...style, size: "s" }), {});
});

test("bold toggles and alignment sits on Alt+Shift", () => {
  assert.deepEqual(styleShortcut(key("KeyB", { metaKey: true }), style), { bold: true });
  assert.deepEqual(styleShortcut(key("KeyC", { altKey: true, shiftKey: true }), style), { align: "center" });
  assert.equal(styleShortcut(key("KeyR", { metaKey: true, shiftKey: true }), style), null);
  assert.equal(styleShortcut(key("KeyB"), style), null);
});

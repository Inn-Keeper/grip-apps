import assert from "node:assert/strict";
import test from "node:test";
import { guardHistoryNavigation } from "./navigation.js";

function fakeWindow() {
  const win = new EventTarget();
  win.pushed = [];
  win.history = { pushState: (state, _title, url) => win.pushed.push({ state, url }) };
  return win;
}

test("history navigation proceeds when no page objects", () => {
  const win = fakeWindow();
  assert.equal(guardHistoryNavigation(win, "board"), true);
  assert.deepEqual(win.pushed, []);
});

test("a refused history navigation puts the current page back in the URL", () => {
  const win = fakeWindow();
  win.addEventListener("grip:navigate", (event) => event.preventDefault());
  assert.equal(guardHistoryNavigation(win, "board"), false);
  assert.deepEqual(win.pushed, [{ state: { page: "board" }, url: "/board" }]);
});

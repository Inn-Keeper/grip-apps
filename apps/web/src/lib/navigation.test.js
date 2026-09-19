import assert from "node:assert/strict";
import test from "node:test";
import { guardHistoryNavigation, isAuthReturn, isFreshSignIn } from "./navigation.js";

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

test("only a signed-out → signed-in change counts as a fresh sign-in", () => {
  assert.equal(isFreshSignIn(null, "u1"), true); // signed in from the sign-in screen
  assert.equal(isFreshSignIn(undefined, "u1"), false); // reload with a stored session
  assert.equal(isFreshSignIn("u1", "u1"), false); // token refresh, tab refocus
  assert.equal(isFreshSignIn(null, null), false); // still signed out
});

test("OAuth returns are recognised in the hash or the query", () => {
  assert.equal(isAuthReturn("", "#access_token=abc&type=bearer"), true);
  assert.equal(isAuthReturn("?code=xyz", ""), true);
  assert.equal(isAuthReturn("?linked=github&code=xyz", ""), true);
  assert.equal(isAuthReturn("", ""), false);
  assert.equal(isAuthReturn("?encode=1", "#barcode=2"), false);
});

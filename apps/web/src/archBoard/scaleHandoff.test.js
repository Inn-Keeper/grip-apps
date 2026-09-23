import assert from "node:assert/strict";
import { test } from "node:test";
import { appendHandoff, scaleHandoff } from "./scaleHandoff.js";

const base = {
  givenLabel: "Given",
  estimateLabel: "My estimate",
  givens: [{ label: "Daily active users", value: "8M" }],
  estimates: [
    { label: "Peak requests per second", unit: "req/s", value: "17000" },
    { label: "Storage over the retention window", unit: "GB", value: "" },
  ],
};

test("nothing estimated yet means nothing to hand over", () => {
  const empty = { ...base, estimates: base.estimates.map((e) => ({ ...e, value: "" })) };
  assert.equal(scaleHandoff(empty), null);
});

test("carries the givens and only the estimates that were filled in", () => {
  const line = scaleHandoff(base);
  assert.match(line, /Given: Daily active users 8M\./);
  assert.match(line, /My estimate: Peak requests per second 17000 req\/s\./);
  assert.doesNotMatch(line, /Storage/);
});

test("carries the reader's own figure, right or wrong, never a derived answer", () => {
  const wrong = { ...base, estimates: [{ label: "Peak requests per second", unit: "req/s", value: "3" }] };
  assert.match(scaleHandoff(wrong), /Peak requests per second 3 req\/s/);
});

test("an empty section takes the line as is", () => {
  assert.equal(appendHandoff("", "the line"), "the line");
  assert.equal(appendHandoff(undefined, "the line"), "the line");
});

test("existing writing is kept, with the line added under it", () => {
  assert.equal(appendHandoff("my notes", "the line"), "my notes\n\nthe line");
});

test("pressing twice does not duplicate the line", () => {
  const once = appendHandoff("my notes", "the line");
  assert.equal(appendHandoff(once, "the line"), once);
});

test("no line means the section is left exactly as it was", () => {
  assert.equal(appendHandoff("my notes", null), "my notes");
});

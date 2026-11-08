import assert from "node:assert/strict";
import test from "node:test";
import { generateWithTimeout } from "./generationRequest.js";

test("a stalled generation times out and aborts its request", async () => {
  let requestSignal;
  await assert.rejects(generateWithTimeout((signal) => {
    requestSignal = signal;
    return new Promise(() => {});
  }, new AbortController().signal, 10), { code: "timeout" });
  assert.equal(requestSignal.aborted, true);
});

test("leaving rejects immediately even if a request ignores abort and replies later", async () => {
  const controller = new AbortController();
  let reply;
  let requestSignal;
  let saves = 0;
  const request = generateWithTimeout((signal) => {
    requestSignal = signal;
    return new Promise((resolve) => { reply = resolve; });
  }, controller.signal).then(() => { saves += 1; });
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
  assert.equal(requestSignal.aborted, true);
  reply({ stories: [] });
  await Promise.resolve();
  assert.equal(saves, 0);
});

test("a cancelled mount never starts generation", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(generateWithTimeout(async () => { calls += 1; }, controller.signal), { name: "AbortError" });
  assert.equal(calls, 0);
});

test("successful responses and provider errors keep their original values", async () => {
  const signal = new AbortController().signal;
  const book = { stories: [] };
  assert.equal(await generateWithTimeout(async () => book, signal), book);
  const error = Object.assign(new Error("Busy"), { code: "busy", retryAfter: 5 });
  await assert.rejects(generateWithTimeout(async () => { throw error; }, signal), (actual) => actual === error);
  assert.equal(signal.aborted, false);
});

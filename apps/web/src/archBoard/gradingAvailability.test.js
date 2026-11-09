import assert from "node:assert/strict";
import test from "node:test";
import { anchorGradingStatus, gradingRefreshInterval } from "./gradingAvailability.js";

test("provider retry duration becomes a deadline once, independent of later edits", () => {
  const status = anchorGradingStatus({ grading: "unavailable", code: "provider_quota_exhausted", retry_after: 60 }, 1000);
  assert.equal(status.retryAt, 61000);
  assert.equal(gradingRefreshInterval(status, 60000), 1000);
  assert.equal(status.retryAt, 61000);
  assert.equal(gradingRefreshInterval(status, 70000), 1000);
});

test("available or unknown-reset statuses do not poll; long limits refresh at most every 30 seconds", () => {
  assert.equal(anchorGradingStatus({ grading: "available" }, 1000).retryAt, null);
  assert.equal(anchorGradingStatus({ grading: "unavailable" }, 1000).retryAt, null);
  assert.equal(gradingRefreshInterval({ grading: "available", retryAt: null }), false);
  assert.equal(gradingRefreshInterval({ grading: "unavailable", retryAt: 100000 }, 1000), 30000);
});

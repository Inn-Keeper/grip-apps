// The service returns a duration. Anchor it when fetched, never while rendering or typing.
export function anchorGradingStatus(status, now = Date.now()) {
  return {
    ...status,
    retryAt: status.grading === "unavailable" && Number.isFinite(status.retry_after) && status.retry_after > 0
      ? now + status.retry_after * 1000 : null,
  };
}

export function gradingRefreshInterval(status, now = Date.now()) {
  return status?.grading === "unavailable" && status.retryAt
    ? Math.max(1000, Math.min(30000, status.retryAt - now)) : false;
}

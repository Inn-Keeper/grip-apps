import { useEffect, useState } from "react";

export const ERROR_KEYS: Record<string, string> = {
  playbook_daily_limit: "firstRun.error.playbook_daily_limit",
  busy: "firstRun.error.busy",
  provider_limited: "firstRun.error.limited",
  provider_quota_exhausted: "firstRun.error.limited",
  invalid_model_response: "firstRun.error.invalid",
  timeout: "firstRun.error.timeout",
};

/** Seconds left on a Retry-After countdown, ticking once a second. */
export function useCountdown(seconds: number | null) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!seconds) return setLeft(0);
    setLeft(seconds);
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);
  return left;
}

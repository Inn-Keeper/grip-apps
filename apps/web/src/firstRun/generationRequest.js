// Allow the service's 180-second model timeout plus response overhead.
const GENERATION_TIMEOUT_MS = 200_000;

/**
 * Bound the wait even if the request ignores cancellation. A late response must
 * never reach the caller's save step after the user has left.
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} generate
 * @param {AbortSignal} signal
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
export async function generateWithTimeout(generate, signal, timeoutMs = GENERATION_TIMEOUT_MS) {
  signal.throwIfAborted();
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", onAbort, { once: true });
  /** @type {Promise<never>} */
  const stopped = new Promise((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(controller.signal.reason), { once: true });
  });
  const timer = setTimeout(() => {
    controller.abort(Object.assign(new Error("Generation timed out"), { code: "timeout" }));
  }, timeoutMs);
  try {
    return await Promise.race([generate(controller.signal), stopped]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  }
}

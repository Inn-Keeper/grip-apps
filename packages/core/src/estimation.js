// Back-of-envelope estimation: the round-two filter at most companies.
//
// Scenarios carry the four figures an interviewer hands you when you ask —
// users, activity, payload size, retention. Peak QPS and storage are *derived*
// from those rather than authored, so the figures the grader checks against are
// arithmetically consistent with the givens by construction and can't drift.

const SECONDS_PER_DAY = 86_400;

/** Daily peak vs. daily average. 3x is the usual back-of-envelope hand-wave. */
export const PEAK_FACTOR = 3;

/** Back-of-envelope convention: 1 GB ≈ 10^6 KB. Nobody says 2^20 out loud. */
const KB_PER_GB = 1_000_000;

/** A number that can take part in arithmetic, or 0. Negatives are nonsense here. */
const positive = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

/**
 * Request rate and write rate are tracked separately on purpose. A read-heavy
 * catalog serves orders of magnitude more traffic than it stores; folding the
 * two together would teach a storage figure that is simply wrong.
 *
 * @typedef {object} ScenarioScale
 * @property {number} dau daily active users
 * @property {number} actionsPerUserPerDay all requests per user per day
 * @property {number} writesPerUserPerDay the subset that persists something
 * @property {number} payloadKb bytes stored per write, in KB
 * @property {number} retentionDays how long the data is kept
 */

/**
 * Turns a scenario's givens into the figures a candidate is asked to produce.
 * @param {ScenarioScale} scale
 * @returns {{
 *   requestsPerDay: number,
 *   writesPerDay: number,
 *   avgQps: number,
 *   peakQps: number,
 *   storageGb: number,
 * }}
 */
export function deriveScale(scale = {}) {
  const dau = positive(scale.dau);
  const requestsPerDay = dau * positive(scale.actionsPerUserPerDay);
  const writesPerDay = dau * positive(scale.writesPerUserPerDay);
  const avgQps = requestsPerDay / SECONDS_PER_DAY;
  return {
    requestsPerDay,
    writesPerDay,
    avgQps,
    peakQps: avgQps * PEAK_FACTOR,
    storageGb: (writesPerDay * positive(scale.payloadKb) * positive(scale.retentionDays)) / KB_PER_GB,
  };
}

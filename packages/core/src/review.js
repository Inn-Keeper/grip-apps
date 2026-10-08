// Spaced repetition over normalized answer_events — no extra tables.
// A tech is a "card": its consecutive-correct streak (ending at the latest
// answer) picks a review interval; the tech is due once that interval has
// passed since the last answer. A wrong answer resets the streak, so the tech
// comes back the next day.
// ponytail: SM-2-lite with fixed doubling intervals; per-question scheduling
// and ease factors only if the per-tech granularity proves too coarse.

/**
 * @typedef {object} ReviewEntry
 * @property {string} tech
 * @property {number} streak consecutive correct answers ending at the latest event
 * @property {number} intervalDays
 * @property {number} dueAt epoch ms
 * @property {boolean} due
 */

export const REVIEW_INTERVALS_DAYS = [1, 2, 4, 8, 16, 32];

const DAY_MS = 86_400_000;

/** @param {number} streak consecutive correct answers ending at the latest event */
export function reviewIntervalDays(streak) {
  return REVIEW_INTERVALS_DAYS[Math.min(streak, REVIEW_INTERVALS_DAYS.length - 1)];
}

/**
 * Builds the review schedule from per-tech stats (answer_tech_stats RPC).
 * Only attempted techs appear; never-seen techs are "new", not "due".
 *
 * @param {Array<{ tech: string, streak: number, last_at: string }>} stats
 * @param {Date} [now]
 * @returns {ReviewEntry[]} due techs first (most overdue leading), then upcoming by dueAt
 */
export function buildReviewQueue(stats = [], now = new Date()) {
  const nowMs = now.getTime();
  return stats
    .map(({ tech, streak, last_at }) => ({ tech, streak, lastTime: new Date(last_at).getTime() }))
    .filter(({ lastTime }) => !Number.isNaN(lastTime))
    .map(({ tech, streak, lastTime }) => {
      const intervalDays = reviewIntervalDays(streak);
      const dueAt = lastTime + intervalDays * DAY_MS;
      return { tech, streak, intervalDays, dueAt, due: dueAt <= nowMs };
    })
    .sort((a, b) => a.dueAt - b.dueAt);
}

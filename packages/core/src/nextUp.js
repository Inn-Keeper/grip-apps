// Picks the one suggested action for the Prep screen, so users always know what to do next.
// Priority: due reviews (time-sensitive) → an active prep plan (a stated goal) →
// weakest techs, or a warm-up for someone who has never answered.

/** @typedef {"review" | "plan" | "weakest" | "warmup"} NextUpKind */

/**
 * @param {{ reviewDueCount: number, hasPlan: boolean, attempts: number }} state
 * @returns {{ primary: NextUpKind, alternatives: NextUpKind[] }}
 */
export function pickNextUp({ reviewDueCount, hasPlan, attempts }) {
  /** @type {NextUpKind[]} */
  const available = [];
  if (reviewDueCount > 0) available.push("review");
  if (hasPlan) available.push("plan");
  available.push(attempts > 0 ? "weakest" : "warmup");
  return { primary: available[0], alternatives: available.slice(1) };
}

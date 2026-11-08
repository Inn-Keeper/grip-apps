// Picks the one suggested action for the Prep screen, so users always know what to do next.
// Priority: due reviews (time-sensitive) → an active prep plan (a stated goal) →
// weakest techs, or a warm-up for someone who has never answered.
// Setup (no playbook yet) leads for brand-new users and is otherwise the last alternative.

/** @typedef {"review" | "plan" | "weakest" | "warmup" | "setup"} NextUpKind */

/**
 * @param {{ reviewDueCount: number, hasPlan: boolean, attempts: number, needsSetup?: boolean }} state
 * @returns {{ primary: NextUpKind, alternatives: NextUpKind[] }}
 */
export function pickNextUp({ reviewDueCount, hasPlan, attempts, needsSetup = false }) {
  /** @type {NextUpKind[]} */
  const available = [];
  if (reviewDueCount > 0) available.push("review");
  if (hasPlan) available.push("plan");
  if (needsSetup && attempts === 0) available.push("setup");
  available.push(attempts > 0 ? "weakest" : "warmup");
  if (needsSetup && attempts > 0) available.push("setup");
  return { primary: available[0], alternatives: available.slice(1) };
}

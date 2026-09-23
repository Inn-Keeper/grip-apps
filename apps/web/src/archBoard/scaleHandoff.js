// Carrying the scale brief into the talk track. Out of the component so it can
// be tested without rendering.

/**
 * The line to drop into the Back-of-envelope section.
 *
 * Carries the givens and the reader's own estimates, never the derived
 * answers. The service grades what you would say, so writing the correct
 * arithmetic in for them would buy a grade nobody earned and feed a readiness
 * score that is not true. A wrong estimate carried over is graded as wrong,
 * which is the honest outcome.
 *
 * Null when nothing has been estimated yet, which leaves the action disabled.
 */
export const scaleHandoff = ({ givenLabel, estimateLabel, givens, estimates }) => {
  const mine = estimates
    .filter((item) => String(item.value ?? "").trim())
    .map((item) => `${item.label} ${String(item.value).trim()} ${item.unit}`);
  if (mine.length === 0) return null;
  const given = givens.map((item) => `${item.label} ${item.value}`).join(", ");
  return `${givenLabel}: ${given}.\n${estimateLabel}: ${mine.join(", ")}.`;
};

/** Adds the line without trampling what is written, and without repeating itself. */
export const appendHandoff = (current = "", line) => {
  if (!line) return current;
  const existing = current.trim();
  if (!existing) return line;
  return existing.includes(line) ? existing : `${existing}\n\n${line}`;
};

// When the talk track can be graded, and when a returned grade still describes
// what is on screen. Out of the component so it can be tested without rendering.

/**
 * Why grading is unavailable, as a locale key, or null when it is ready.
 *
 * A provider limit comes first: nothing the user does locally clears it, so
 * offering to save or to write more would be a lie. The text bar below it is
 * the service's own — it refuses only when every section is blank, not at the
 * 40-character "covered" bar, which would block a short but real answer with a
 * message saying nothing had been written.
 */
export const gradeBlockedKey = (boardId, writtenCount, limited = false) =>
  limited
    ? "talk.gradeLimited"
    : !boardId
      ? "talk.gradeNeedsSave"
      : writtenCount === 0
        ? "talk.gradeNeedsText"
        : null;

/** Local clock time a provider limit lapses, for "grading returns at 3:07 PM". */
export const resumeTime = (seconds, now = Date.now()) =>
  new Date(now + (seconds ?? 0) * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * The grade detail to render, or null. A grade belongs to the text that earned
 * it — editing a section clears `grade` — and to the board it was asked for.
 */
export const gradeDetailFor = (grade, detail, boardId) =>
  grade === null || !detail || detail.board_id !== boardId ? null : detail;

/**
 * The verdict to state after grading: how much earned credit, and the one
 * section to fix first.
 *
 * Missing sorts before thin because absent reasoning costs more in an
 * interview than shallow reasoning. Returns null when no detail is on hand,
 * which is the normal case for a board loaded from storage: the score is
 * persisted but the per-section breakdown is not.
 */
export const gradeVerdict = (detail, sectionIds) => {
  if (!detail) return null;
  const byId = new Map(detail.suggestion.sections.map((item) => [item.section, item]));
  const graded = sectionIds.map((id) => byId.get(id)).filter(Boolean);
  if (graded.length === 0) return null;
  return {
    covered: graded.filter((item) => item.verdict === "covered").length,
    total: sectionIds.length,
    weakest:
      graded.find((item) => item.verdict === "missing") ??
      graded.find((item) => item.verdict === "thin") ??
      null,
  };
};

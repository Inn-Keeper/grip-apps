import { TALK_TRACK_SECTIONS } from "./talkTrack.js";

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
 * The verdict to state after grading: how much earned credit, and the one
 * section to fix first.
 *
 * Missing sorts before thin because absent reasoning costs more in an
 * interview than shallow reasoning. Returns null when no detail is on hand,
 * as on a legacy board saved with a score but no assessment.
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

// ── What each assessment depends on ──────────────────────────────────────────
// The topology result depends on the scenario and the diagram's meaning (not where boxes sit).
// The reasoning grade also depends on the explanation, self-rating and a free board's brief.
// A story link feeds neither, so linking a story keeps both.

const GEOMETRY = new Set(["x", "y", "w", "h", "x2", "y2", "style"]);
// Sorted keys, so a document built by web or mobile gives the same key.
const stable = (value) =>
  Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value).filter((k) => value[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`
      : JSON.stringify(value ?? null);
const meaning = (node) => Object.fromEntries(Object.entries(node).filter(([key]) => !GEOMETRY.has(key)));

export const topologyKey = (doc) => stable([doc.scenarioId, doc.nodes.map(meaning), doc.edges]);
export const gradeInputsKey = (doc) =>
  stable([topologyKey(doc), (doc.brief ?? "").trim(), doc.talkSections ?? {}, doc.talkRating ?? null]);

export const topologyChanged = (prev, next) => topologyKey(prev) !== topologyKey(next);

/** Applies an edit; the reasoning grade and its detail drop when what they graded changed. */
export const applyBoardPatch = (doc, patch) => {
  const next = { ...doc, ...patch };
  return gradeInputsKey(next) === gradeInputsKey(doc) ? next : { ...next, talkGrade: null, talkAssessment: null };
};

/** A grading response still describes the board on screen: same board, same inputs as submitted. */
export const gradeStillApplies = (submitted, boardId, doc) =>
  !!submitted && submitted.boardId === boardId && submitted.inputs === gradeInputsKey(doc);

// ── The persisted assessment (arch_boards.talk_assessment) ───────────────────
const ASSESSMENT_VERSION = 1;

export const makeAssessment = (doc, result) => ({ version: ASSESSMENT_VERSION, inputs: gradeInputsKey(doc), result });

const SECTION_IDS = new Set(TALK_TRACK_SECTIONS.map((section) => section.id));
const VERDICTS = new Set(["covered", "thin", "missing"]);
const nonblank = (value) => typeof value === "string" && value.trim().length > 0;
const isSection = (section) =>
  !!section && SECTION_IDS.has(section.section) && VERDICTS.has(section.verdict) &&
  typeof section.evidence === "string" && nonblank(section.gap) &&
  (section.verdict === "missing" ? section.evidence.trim() === "" : nonblank(section.evidence));
const isResult = (r) =>
  !!r && nonblank(r.board_id) && Number.isInteger(r.score) && r.score >= 0 && r.score <= 100 &&
  (r.divergence === null || (Number.isInteger(r.divergence) && Math.abs(r.divergence) <= 100)) &&
  Array.isArray(r.suggestion?.sections) && r.suggestion.sections.length === SECTION_IDS.size &&
  r.suggestion.sections.every(isSection) && new Set(r.suggestion.sections.map((s) => s.section)).size === SECTION_IDS.size &&
  nonblank(r.suggestion.hardest_followup);

/** A stored payload, or null when legacy, malformed or from an unknown version. */
export const parseAssessment = (json) =>
  json && typeof json === "object" && json.version === ASSESSMENT_VERSION && typeof json.inputs === "string" && isResult(json.result)
    ? json
    : null;

/** The grading detail to render: only while the document still matches what was graded. */
export const assessmentFor = (doc, boardId = doc.id) => {
  const assessment = parseAssessment(doc.talkAssessment);
  return assessment && assessment.result.score === doc.talkGrade &&
    (boardId === undefined || assessment.result.board_id === boardId) &&
    assessment.inputs === gradeInputsKey(doc) ? assessment.result : null;
};

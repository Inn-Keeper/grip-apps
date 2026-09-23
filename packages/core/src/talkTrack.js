// Talk track: the spoken half of a system-design round, captured as text.
//
// The Arch Board scores topology — which boxes exist and how they're wired.
// An interviewer scores the reasoning said out loud on the way there. These are
// the six beats that reasoning is graded on, in the order a real round walks
// them. Content is English-only, same as the scenario briefs and STAR prompts.

/** Self-assessment scale, matching STORY_RATING_MAX in mockLoop.js. */
export const SELF_RATING_MAX = 5;

/**
 * A section counts as answered at roughly one full sentence. Shorter than this
 * is a placeholder ("cache + db"), which is exactly the hand-waving the talk
 * track exists to train out.
 */
export const SUBSTANTIVE_CHARS = 40;

/**
 * @typedef {object} TalkTrackSection
 * @property {string} id
 * @property {string} label
 * @property {string} hint
 */

/** @type {TalkTrackSection[]} */
export const TALK_TRACK_SECTIONS = [
  {
    id: "requirements",
    label: "Requirements",
    hint: "What must it do, and what must it guarantee? Latency target, availability, consistency. Name what you're explicitly leaving out of scope.",
  },
  {
    id: "scale",
    label: "Back-of-envelope",
    hint: "DAU, peak QPS, payload size, storage per year. Show the arithmetic. Order of magnitude is what's being graded, not precision.",
  },
  {
    id: "api",
    label: "API surface",
    hint: "The three to five calls that matter. Method, path, parameters, and what comes back.",
  },
  {
    id: "dataModel",
    label: "Data model",
    hint: "Core entities, the partition and sort key, and which store owns each one. Say why that key and not another.",
  },
  {
    id: "bottleneck",
    label: "Bottleneck & deep dive",
    hint: "Name the component that breaks first at 10x, then fix it out loud: shard, replicate, cache, or shed load.",
  },
  {
    id: "tradeoff",
    label: "Tradeoffs",
    hint: "The call you made, the alternative you rejected, and the condition that would flip your choice.",
  },
];

const SECTION_IDS = TALK_TRACK_SECTIONS.map((s) => s.id);

/**
 * A blank talk track — every section present and empty, no self-rating yet.
 * @returns {Record<string, string>}
 */
export function emptyTalkTrack() {
  return Object.fromEntries(SECTION_IDS.map((id) => [id, ""]));
}

/**
 * Coerces persisted JSON into a full, well-shaped talk track. Unknown keys are
 * dropped and missing sections become empty strings, so a board saved before a
 * section existed still loads.
 * @param {unknown} raw
 * @returns {{ sections: Record<string, string>, rating: number | null }}
 */
export function normalizeTalkTrack(raw) {
  const source = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const stored = source.sections && typeof source.sections === "object" ? source.sections : {};
  const sections = Object.fromEntries(
    SECTION_IDS.map((id) => [id, typeof stored[id] === "string" ? stored[id] : ""])
  );

  const rawRating = Number(source.rating);
  const rating =
    Number.isFinite(rawRating) && rawRating >= 1 && rawRating <= SELF_RATING_MAX
      ? Math.round(rawRating)
      : null;

  return { sections, rating };
}

/**
 * Reports talk-track coverage. `completion` is structural (did you cover all
 * six beats), while `rating` remains the candidate's own confidence note.
 * Neither is evidence of reasoning quality, so this function does not score it.
 *
 * @param {unknown} raw a talk track in stored shape
 * @returns {{
 *   sections: Record<string, string>,
 *   rating: number | null,
 *   answered: string[],
 *   missing: string[],
 *   completion: number,
 * }}
 */
export function scoreTalkTrack(raw) {
  const { sections, rating } = normalizeTalkTrack(raw);

  const answered = SECTION_IDS.filter((id) => sections[id].trim().length >= SUBSTANTIVE_CHARS);
  const missing = SECTION_IDS.filter((id) => !answered.includes(id));
  const completion = Math.round((answered.length / SECTION_IDS.length) * 100);

  return { sections, rating, answered, missing, completion };
}

/**
 * True when a talk track has any content worth persisting — lets the board
 * avoid writing six empty strings for every quick topology drill.
 * @param {unknown} raw
 * @returns {boolean}
 */
export function hasTalkTrackContent(raw) {
  const { sections, rating } = normalizeTalkTrack(raw);
  return rating !== null || SECTION_IDS.some((id) => sections[id].trim() !== "");
}

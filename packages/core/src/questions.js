// Validation for the tiered question bank. The seed script and the content
// test both run this so "valid in the repo" and "valid to seed" can never drift.
import { DIFFICULTY_KEYS } from "./difficulty.js";

const OPTION_COUNT = 4;

const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";

/**
 * Checks one question against the seed contract. Returns an array of human-
 * readable problems ([] means valid).
 * @param {object} q
 * @returns {string[]}
 */
export function validateQuestion(q) {
  const errors = [];
  const where = isNonEmptyString(q?.prompt) ? `"${q.prompt.slice(0, 50)}"` : "(no prompt)";
  if (!isNonEmptyString(q?.tech)) errors.push(`${where}: missing tech`);
  if (!isNonEmptyString(q?.category)) errors.push(`${where}: missing category`);
  if (!DIFFICULTY_KEYS.includes(q?.difficulty)) errors.push(`${where}: difficulty must be one of ${DIFFICULTY_KEYS.join("/")}, got "${q?.difficulty}"`);
  if (!isNonEmptyString(q?.prompt)) errors.push(`${where}: missing prompt`);
  if (!Array.isArray(q?.options) || q.options.length !== OPTION_COUNT) {
    errors.push(`${where}: needs exactly ${OPTION_COUNT} options`);
  } else if (!q.options.every(isNonEmptyString)) {
    errors.push(`${where}: every option must be a non-empty string`);
  } else if (new Set(q.options.map((o) => o.trim())).size !== OPTION_COUNT) {
    errors.push(`${where}: options must all be different`);
  }
  if (!Number.isInteger(q?.correct) || q.correct < 0 || q.correct >= OPTION_COUNT) {
    errors.push(`${where}: correct must be an integer 0..${OPTION_COUNT - 1}`);
  }
  if (q?.explanation != null && typeof q.explanation !== "string") {
    errors.push(`${where}: explanation must be a string when present`);
  }
  return errors;
}

// Case, punctuation and spacing don't make a question new: "What is JSX?" and
// "what is jsx" are the same question.
export const normalizePrompt = (prompt) =>
  prompt.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();

/**
 * Validates a full set and flags duplicate prompts within a tech, across all its
 * difficulty levels (the same question at two levels still repeats for the learner).
 * Different techs may share a prompt: "What does EXPLAIN show?" differs in MySQL and PostgreSQL.
 * @param {object[]} questions
 * @returns {string[]}
 */
export function validateQuestionSet(questions) {
  const errors = questions.flatMap(validateQuestion);
  const seen = new Map();
  for (const q of questions) {
    if (!q?.tech || !q?.difficulty || !q?.prompt) continue;
    const key = `${q.tech}|${normalizePrompt(q.prompt)}`;
    const first = seen.get(key);
    if (first) errors.push(`duplicate prompt in ${q.tech} (${first} and ${q.difficulty}): "${q.prompt.slice(0, 50)}"`);
    else seen.set(key, q.difficulty);
  }
  return errors;
}

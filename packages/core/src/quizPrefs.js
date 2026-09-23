export const QUIZ_SIZE_STORAGE_KEY = "grip.quizSize";
export const QUIZ_SIZE_MIN = 1;
export const QUIZ_SIZE_DEFAULT_MAX = 20;
export const DEFAULT_QUIZ_SIZE = null;

/** @type {{ label: string, value: number | null }[]} */
export const QUIZ_SIZE_OPTIONS = [
  { label: "1", value: 1 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "All", value: null },
];

/**
 * @param {string | number | null | undefined} raw
 * @returns {number | null}
 */
export function parseQuizSize(raw) {
  if (raw === null || raw === undefined || raw === "") return DEFAULT_QUIZ_SIZE;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= QUIZ_SIZE_MIN ? n : DEFAULT_QUIZ_SIZE;
}

/**
 * @param {string | number | null | undefined} value
 * @returns {string | null}
 */
export function serializeQuizSize(value) {
  const normalized = normalizeQuizSize(value);
  return normalized === null ? null : String(normalized);
}

/**
 * @param {string | number | null | undefined} value
 * @returns {number | null}
 */
export const normalizeQuizSize = parseQuizSize;

/**
 * @param {number | null | undefined} poolSize
 * @returns {number}
 */
export function quizSizeMax(poolSize) {
  return Math.max(poolSize ?? QUIZ_SIZE_DEFAULT_MAX, QUIZ_SIZE_MIN);
}

/**
 * @param {number | null} quizSize
 * @param {number | null | undefined} poolSize
 * @returns {number}
 */
export function effectiveQuizSize(quizSize, poolSize) {
  const max = quizSizeMax(poolSize);
  return quizSize === null ? max : Math.min(normalizeQuizSize(quizSize) ?? max, max);
}

/**
 * @param {number | null} quizSize
 * @param {number} poolSize
 * @returns {number}
 */
export function questionCapForPool(quizSize, poolSize) {
  const normalized = normalizeQuizSize(quizSize);
  return normalized === null ? poolSize : Math.min(normalized, poolSize);
}

export const AUTO_NEXT_STORAGE_KEY = "grip.autoNext";
// Time to take in the answer and its +XP before moving on; Next skips the wait.
export const AUTO_NEXT_MS = 5000;

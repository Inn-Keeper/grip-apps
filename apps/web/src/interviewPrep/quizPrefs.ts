import { DIFFICULTY_KEYS } from "@grip/core/difficulty";
import { AUTO_NEXT_MS, AUTO_NEXT_STORAGE_KEY, parseQuizSize, serializeQuizSize, QUIZ_SIZE_STORAGE_KEY } from "@grip/core/quizPrefs";

/** Returns the stored quiz size, or null meaning "use all available". */
export function getQuizSize() {
  if (typeof window === "undefined") return null;
  return parseQuizSize(window.localStorage.getItem(QUIZ_SIZE_STORAGE_KEY));
}

export function setQuizSize(value: number | null) {
  if (typeof window === "undefined") return;
  const serialized = serializeQuizSize(value);
  if (serialized === null) {
    window.localStorage.removeItem(QUIZ_SIZE_STORAGE_KEY);
  } else {
    window.localStorage.setItem(QUIZ_SIZE_STORAGE_KEY, serialized);
  }
}

const LEVEL_STORAGE_KEY = "grip.difficulty";
const DEFAULT_LEVEL = "mid";

/** The stored difficulty tier; anything unknown (or nothing) falls back to Tailwind. */
export function getLevel(): string {
  if (typeof window === "undefined") return DEFAULT_LEVEL;
  const saved = window.localStorage.getItem(LEVEL_STORAGE_KEY);
  return saved && (DIFFICULTY_KEYS as string[]).includes(saved) ? saved : DEFAULT_LEVEL;
}

export function saveLevel(key: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(LEVEL_STORAGE_KEY, key);
}

// Shared with mobile, so both apps pace Auto-next the same.
export { AUTO_NEXT_MS };

/** Whether sessions move on by themselves after a correct answer (off unless chosen). */
export function getAutoNext(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(AUTO_NEXT_STORAGE_KEY) === "1";
}

export function saveAutoNext(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(AUTO_NEXT_STORAGE_KEY, "1");
  else window.localStorage.removeItem(AUTO_NEXT_STORAGE_KEY);
}

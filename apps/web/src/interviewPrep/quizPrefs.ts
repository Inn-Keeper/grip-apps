import { parseQuizSize, serializeQuizSize, QUIZ_SIZE_STORAGE_KEY } from "@grip-apps/core/quizPrefs";

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

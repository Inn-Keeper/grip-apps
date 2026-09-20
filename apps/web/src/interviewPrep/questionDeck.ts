import { drawFromDeck } from "@grip/core/quiz";

// Which bank questions this browser has already been shown, per difficulty, so quizzes and
// drills work through every question before repeating one. Per device by design (no DB
// column); App clears it when the signed-in user changes.
const STORAGE_KEY = "grip.seenQuestions";

type SeenByDifficulty = Record<string, string[]>;

const read = (): SeenByDifficulty => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as SeenByDifficulty;
  } catch {
    return {};
  }
};

export function drawUnseen<Q extends { id: string }>(difficulty: string, pool: Q[], n: number): Q[] {
  const all = read();
  const { picked, seen } = drawFromDeck(pool, all[difficulty] ?? [], n);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [difficulty]: seen }));
  } catch {
    // Storage full or blocked: the draw still works, it just won't be remembered.
  }
  return picked;
}

export function clearSeenQuestions() {
  window.localStorage.removeItem(STORAGE_KEY);
}

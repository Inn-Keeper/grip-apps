import AsyncStorage from "@react-native-async-storage/async-storage";
import { drawFromDeck } from "@grip/core/quiz";

// Which bank questions this device has already shown, per difficulty, so quizzes and
// drills work through every question before repeating one. Same key and shape as web;
// the root layout clears it when the signed-in user changes.
const STORAGE_KEY = "grip.seenQuestions";

type SeenByDifficulty = Record<string, string[]>;

export async function drawUnseen<Q extends { id: string }>(difficulty: string, pool: Q[], n: number): Promise<Q[]> {
  let all: SeenByDifficulty = {};
  try {
    all = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? "{}") as SeenByDifficulty;
  } catch {
    // Unreadable storage: draw as if nothing was seen.
  }
  const { picked, seen } = drawFromDeck(pool, all[difficulty] ?? [], n);
  // Storage full or blocked: the draw still works, it just won't be remembered.
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [difficulty]: seen })).catch(() => undefined);
  return picked;
}

export function clearSeenQuestions() {
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
}

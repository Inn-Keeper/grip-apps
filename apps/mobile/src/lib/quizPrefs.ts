import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTO_NEXT_STORAGE_KEY, parseQuizSize, serializeQuizSize, QUIZ_SIZE_STORAGE_KEY } from "@grip/core/quizPrefs";

export async function getQuizSize() {
  return parseQuizSize(await AsyncStorage.getItem(QUIZ_SIZE_STORAGE_KEY));
}

export async function setQuizSize(value: number | null) {
  const serialized = serializeQuizSize(value);
  if (serialized === null) {
    await AsyncStorage.removeItem(QUIZ_SIZE_STORAGE_KEY);
  } else {
    await AsyncStorage.setItem(QUIZ_SIZE_STORAGE_KEY, serialized);
  }
}

/** Whether drills move on by themselves after a correct answer (off unless chosen), as on web. */
export async function getAutoNext() {
  return (await AsyncStorage.getItem(AUTO_NEXT_STORAGE_KEY)) === "1";
}

export async function setAutoNext(value: boolean) {
  if (value) await AsyncStorage.setItem(AUTO_NEXT_STORAGE_KEY, "1");
  else await AsyncStorage.removeItem(AUTO_NEXT_STORAGE_KEY);
}

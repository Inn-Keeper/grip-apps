import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseQuizSize, serializeQuizSize, QUIZ_SIZE_STORAGE_KEY } from "@grip-apps/core/quizPrefs";

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

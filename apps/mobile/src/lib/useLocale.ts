import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocale, setLocale, subscribeLocale } from "@grip/core/i18n";

export const LOCALE_STORAGE_KEY = "grip.locale";

// Subscribes a component to the i18n store so t() re-renders on language
// change. getLocale is the snapshot; subscribeLocale fires on setLocale().
export function useLocale(): string {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

// Restore the persisted locale on launch. AsyncStorage is async, so this runs
// post-mount; setLocale notifies the store and updates t() everywhere.
export async function restoreLocale(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved) setLocale(saved);
  } catch (error) {
    console.warn("Failed to restore locale", error);
  }
}

// Change locale and persist the choice. setLocale updates the live store
// (re-rendering t() consumers); AsyncStorage makes it survive relaunches.
export function changeLocale(code: string): void {
  setLocale(code);
  AsyncStorage.setItem(LOCALE_STORAGE_KEY, code).catch((error) =>
    console.warn("Failed to persist locale", error)
  );
}

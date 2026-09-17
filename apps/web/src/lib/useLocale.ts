import { useSyncExternalStore } from "react";
import { getLocale, subscribeLocale } from "@grip/core/i18n";

// Subscribes a component to the i18n store so t() re-renders on language
// change. getLocale is the snapshot; subscribeLocale fires on setLocale().
export function useLocale(): string {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

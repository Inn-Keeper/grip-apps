import { useSyncExternalStore } from "react";
import { themes } from "@grip/core/tokens";

// Theme choice lives on the device. Dark is the default; System follows the OS.
// index.html runs the same resolve before first paint, so keep THEME_KEY in sync there.
export type ThemePref = "dark" | "light" | "system";
export const THEME_PREFS: ThemePref[] = ["dark", "light", "system"];
const THEME_KEY = "grip.theme";

const listeners = new Set<() => void>();
const lightQuery = () => window.matchMedia("(prefers-color-scheme: light)");

export function getThemePref(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "system" ? stored : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(pref: ThemePref = getThemePref()) {
  const theme = pref === "system" ? (lightQuery().matches ? "light" : "dark") : pref;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themes[theme].colors.bgDeep);
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Private mode or blocked storage: the choice still applies for this visit.
  }
  applyTheme(pref);
  for (const listener of listeners) listener();
}

/** Applies the stored choice and follows OS changes while System is selected. */
export function initTheme() {
  applyTheme();
  lightQuery().addEventListener("change", () => {
    if (getThemePref() === "system") applyTheme("system");
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, getThemePref, getThemePref);
}

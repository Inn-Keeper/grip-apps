import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { shade, themes } from "@grip/core/tokens";

export { alpha, brand, brandColors, font, layout, space, radius } from "@grip/core/tokens";

// Theme choice lives on the device. Dark is the default; System follows the OS.
export type ThemePref = "dark" | "light" | "system";
export const THEME_PREFS: ThemePref[] = ["dark", "light", "system"];
const THEME_KEY = "grip.theme";

type Scheme = keyof typeof themes;

function buildTheme(scheme: Scheme, pref: ThemePref, setPref: (pref: ThemePref) => void) {
  const theme = themes[scheme];
  // dataColor(): pastel data colors from core (node types, categories, competencies, difficulty,
  // contact statuses), shaded in light. Wrap them where they render, once.
  const dataColor = <T extends string | undefined>(hex: T): T => (hex ? shade(hex, theme.dataShade) : hex) as T;
  return { ...theme, scheme, pref, setPref, dataColor };
}

export type Theme = ReturnType<typeof buildTheme>;

// Default is dark, so components (and tests) render without a provider.
const ThemeContext = createContext<Theme>(buildTheme("dark", "dark", () => {}));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const os = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "system") setPrefState(stored);
      })
      .catch(() => {});
  }, []);

  const scheme: Scheme = pref === "system" ? (os === "light" ? "light" : "dark") : pref;

  // Native chrome (tab bar glass, keyboard, alerts, pickers) follows the app's choice, not the OS.
  useEffect(() => {
    Appearance.setColorScheme(pref === "system" ? "unspecified" : pref);
  }, [pref]);
  const value = useMemo(
    () =>
      buildTheme(scheme, pref, (next) => {
        setPrefState(next);
        AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      }),
    [scheme, pref],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

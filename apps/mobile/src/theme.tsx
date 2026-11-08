import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
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
  // data(): pastel data colors (node types, categories, competencies, difficulty), shaded in light.
  return { ...theme, scheme, pref, setPref, data: (hex: string) => shade(hex, theme.dataShade) };
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

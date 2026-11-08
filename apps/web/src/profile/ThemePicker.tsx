import { t } from "@grip/core/i18n";
import { THEME_PREFS, setThemePref, useThemePref } from "../lib/theme";
import { alpha, colors, font } from "../lib/tokens";

const LABEL_KEYS = { dark: "profile.themeDark", light: "profile.themeLight", system: "profile.themeSystem" } as const;

// Device-local theme choice: Dark (default), Light or System.
export function ThemePicker() {
  const pref = useThemePref();
  return (
    <div
      role="group"
      aria-labelledby="theme-picker-label"
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      {THEME_PREFS.map((option) => {
        const active = pref === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => setThemePref(option)}
            style={{
              padding: "6px 12px",
              background: active ? alpha(colors.accent, 0.14) : "transparent",
              border: `1px solid ${active ? colors.accent : colors.borderSoft}`,
              borderRadius: 8,
              color: active ? colors.textBright : colors.textDim,
              fontSize: font.size.small,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t(LABEL_KEYS[option])}
          </button>
        );
      })}
    </div>
  );
}

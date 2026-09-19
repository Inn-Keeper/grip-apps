import { DIFFICULTIES } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { DifficultyIcon } from "./DifficultyIcon";
import { SettingSection } from "./SettingSection";
import styles from "./InterviewPrep.module.css";

// Sidebar difficulty picker. Sets the global level that drives both the quiz
// cards and the drill, so the whole screen runs at one tier.
export function LevelSelector({ level, onLevel }: { level: string; onLevel: (key: string) => void }) {
  return (
    <SettingSection title={t("prep.difficultyLevel")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {DIFFICULTIES.map((d) => {
          const active = d.key === level;
          return (
            <button
              key={d.key}
              onClick={() => onLevel(d.key)}
              aria-pressed={active}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                padding: "9px 11px",
                background: active ? `${d.color}24` : "transparent",
                border: `1px solid ${active ? d.color : colors.borderSoft}`,
                borderRadius: 9,
                cursor: "pointer",
              }}
            >
              <DifficultyIcon tier={d} size={18} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: font.size.body, fontWeight: 800, color: active ? d.color : colors.text }}>{d.label}</span>
                {/* Brand voice, not guidance: hidden on phones to keep the list short. */}
                <span className={styles.tierBlurb} style={{ display: "block", fontSize: font.size.label, color: colors.textFaint }}>{t(d.blurbKey as Parameters<typeof t>[0])}</span>
              </span>
              <span style={{ fontSize: font.size.label, fontWeight: 800, color: active ? d.color : colors.textFaint }}>+{d.xp}</span>
            </button>
          );
        })}
      </div>
    </SettingSection>
  );
}

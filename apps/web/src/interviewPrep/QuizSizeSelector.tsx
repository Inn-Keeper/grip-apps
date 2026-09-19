import { effectiveQuizSize, normalizeQuizSize, quizSizeMax, QUIZ_SIZE_MIN } from "@grip/core/quizPrefs";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { SettingSection } from "./SettingSection";

export function QuizSizeSelector({ quizSize, poolSize, onQuizSize }: { quizSize: number | null; poolSize: number | null; onQuizSize: (v: number | null) => void }) {
  const isAll = quizSize === null;
  // Slider ceiling is availability, not the selected preference. Once a card
  // detects the real pool size, the user's chosen cap should not become the max.
  const max = quizSizeMax(poolSize);
  const effective = effectiveQuizSize(quizSize, poolSize);
  // Nothing until a card has been opened: the pool size is only known then.
  const subtitle =
    poolSize === null
      ? undefined
      : isAll
        ? t("prep.quizPoolAll", { count: poolSize })
        : t("prep.quizPoolCount", { count: poolSize });

  return (
    <SettingSection
      title={t("prep.questionsPerCard")}
      hint={subtitle}
      right={<span style={{ fontSize: font.size.bodyLg, fontWeight: 800, color: colors.textBright, fontVariantNumeric: "tabular-nums" }}>{isAll ? t("prep.all") : effective}</span>}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="range"
          aria-label={t("prep.questionsPerCard")}
          min={QUIZ_SIZE_MIN}
          max={Math.max(max, QUIZ_SIZE_MIN)}
          step={1}
          value={effective}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onQuizSize(normalizeQuizSize(v));
          }}
          style={{ flex: 1, minWidth: 0, height: 24, accentColor: colors.accent }}
        />
        <button
          type="button"
          onClick={() => onQuizSize(null)}
          disabled={isAll}
          aria-pressed={isAll}
          style={{
            padding: "3px 9px",
            background: "transparent",
            border: `1px solid ${isAll ? colors.accent : colors.borderSoft}`,
            borderRadius: 6,
            color: isAll ? colors.accent : colors.textFaint,
            fontSize: font.size.label,
            fontWeight: 800,
            cursor: isAll ? "default" : "pointer",
          }}
        >
          {t("prep.all")}
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: colors.textFaint, fontSize: font.size.label, fontWeight: 700 }}>
        <span>{QUIZ_SIZE_MIN}</span>
        <span>{max > QUIZ_SIZE_MIN ? max : "—"}</span>
      </div>
    </SettingSection>
  );
}

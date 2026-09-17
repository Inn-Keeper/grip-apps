import { effectiveQuizSize, normalizeQuizSize, quizSizeMax, QUIZ_SIZE_MIN } from "@grip/core/quizPrefs";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";

export function QuizSizeSelector({ quizSize, poolSize, onQuizSize }: { quizSize: number | null; poolSize: number | null; onQuizSize: (v: number | null) => void }) {
  const isAll = quizSize === null;
  // Slider ceiling is availability, not the selected preference. Once a card
  // detects the real pool size, the user's chosen cap should not become the max.
  const max = quizSizeMax(poolSize);
  const effective = effectiveQuizSize(quizSize, poolSize);
  const subtitle =
    poolSize === null
      ? t("prep.quizPoolHint")
      : isAll
        ? t("prep.quizPoolAll", { count: poolSize })
        : t("prep.quizPoolCount", { count: poolSize });

  return (
    <WorkspacePanel>
      <WorkspaceTitle
        icon={<BrandIcon name="layers" color={colors.accentBright} size={17} />}
        title={t("prep.questionsPerCard")}
        subtitle={subtitle}
      />
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: colors.textBright }}>{isAll ? t("prep.all") : effective}</span>
          <button
            type="button"
            onClick={() => onQuizSize(null)}
            disabled={isAll}
            style={{
              padding: "3px 9px",
              background: "transparent",
              border: `1px solid ${isAll ? colors.accent : colors.border}`,
              borderRadius: 6,
              color: isAll ? colors.accent : colors.textFaint,
              fontSize: 11,
              fontWeight: 800,
              cursor: isAll ? "default" : "pointer",
            }}
          >
            {t("prep.all")}
          </button>
        </div>
        <input
          type="range"
          min={QUIZ_SIZE_MIN}
          max={Math.max(max, QUIZ_SIZE_MIN)}
          step={1}
          value={effective}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onQuizSize(normalizeQuizSize(v));
          }}
          style={{ width: "100%", accentColor: colors.accent }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: colors.textFaint, fontSize: 10.5, fontWeight: 700 }}>
          <span>{QUIZ_SIZE_MIN}</span>
          <span>{max > QUIZ_SIZE_MIN ? max : "—"}</span>
        </div>
      </div>
    </WorkspacePanel>
  );
}

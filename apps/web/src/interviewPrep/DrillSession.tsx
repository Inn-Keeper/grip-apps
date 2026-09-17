import { CORRECT_XP, PERFECT_QUIZ_BONUS } from "@grip/core/gamification";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import type { DrillState } from "./types";
import { DifficultyIcon } from "./DifficultyIcon";
import { QuizQuestion } from "./QuizQuestion";
import { useCountUp } from "./useCountUp";

export function DrillSession({ drill, onAnswer, onNext, onExit, onRestart }: { drill: DrillState; onAnswer: (i: number) => void; onNext: () => void; onExit: () => void; onRestart?: () => void }) {
  const { questions, index, answered, correctCount, done } = drill;
  const tier = difficultyByKey(drill.difficulty);
  const perAnswerXp = tier?.xp ?? CORRECT_XP;
  const shownCorrect = useCountUp(done ? correctCount : 0);

  if (done) {
    const perfect = correctCount === questions.length;
    return (
      <div
        style={{
          background: colors.well, border: `1px solid ${colors.border}`, borderRadius: 14,
          padding: "32px 24px", textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 8px",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${perfect ? colors.success : colors.accent}20`,
            border: `1px solid ${perfect ? colors.success : colors.accent}60`,
          }}
        >
          <BrandIcon
            name={perfect ? "rank" : correctCount >= questions.length / 2 ? "spark" : "story"}
            color={perfect ? colors.successBright : colors.accentBright}
            size={25}
          />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: colors.textBright, marginBottom: 6 }}>
          {shownCorrect} / {questions.length}
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: colors.textDim }}>
          {t("prep.drillResult", {
            xp: correctCount * perAnswerXp,
            bonus: perfect ? t("prep.perfectBonusSuffix", { bonus: PERFECT_QUIZ_BONUS }) : "",
          })}
        </p>
        {correctCount * 2 < questions.length && (
          <p style={{ margin: "-12px 0 20px", fontSize: 12.5, color: colors.textFaint }}>{t("prep.drillEncourage")}</p>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {onRestart && (
          <button
            onClick={onRestart}
            style={{
              padding: "9px 18px", background: "transparent", border: `1px solid ${colors.accent}60`,
              borderRadius: 8, color: colors.accentBright, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("prep.drillAgain")}
          </button>
        )}
        <button
          onClick={onExit}
          style={{
            padding: "9px 18px", background: colors.accent, border: "none", borderRadius: 8,
            color: colors.onAccent, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          {t("prep.backToCards")}
        </button>
        </div>
      </div>
    );
  }

  const cur = questions[index]!;

  return (
    <div
      style={{
        background: colors.well, border: `1px solid ${cur.color}40`, borderRadius: 14,
        padding: "20px", display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, color: cur.color, letterSpacing: "0.08em" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <BrandIcon name="drill" color={cur.color} size={13} />
            DRILL · {cur.tech}
          </span>
          {tier && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: `${tier.color}1A`, border: `1px solid ${tier.color}60`, color: tier.color, letterSpacing: "0.04em" }}>
              <DifficultyIcon tier={tier} size={13} /> {tier.label.toUpperCase()}
            </span>
          )}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: colors.textFaint }}>{index + 1} / {questions.length}</span>
          <button
            onClick={onExit}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", background: "transparent", border: `1px solid ${colors.border}`,
              borderRadius: 8, color: colors.textFaint, fontSize: 10, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("prep.exit")}
            <BrandIcon name="close" color={colors.textFaint} size={11} />
          </button>
        </span>
      </div>

      <QuizQuestion
        question={cur.q}
        questionNumber={index + 1}
        total={questions.length}
        answered={answered}
        xp={perAnswerXp}
        color={cur.color}
        link={cur.link}
        large
        onAnswer={onAnswer}
        onNext={onNext}
        wrongExtra={
          // ponytail: static placeholder — becomes a real Poe answer-explainer
          // once a Claude API key is wired up (parked for the next round).
          <button
            disabled
            title={t("prep.poeSoonHint")}
            style={{
              padding: "3px 10px",
              background: "transparent",
              border: `1px dashed ${colors.border}`,
              borderRadius: 999,
              color: colors.textFaint,
              fontSize: 11,
              fontWeight: 600,
              cursor: "default",
            }}
          >
            {t("prep.poeSoon")}
          </button>
        }
      />
    </div>
  );
}

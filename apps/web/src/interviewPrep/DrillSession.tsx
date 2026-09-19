import { useEffect, useEffectEvent } from "react";
import { CORRECT_XP, PERFECT_QUIZ_BONUS } from "@grip/core/gamification";
import { SPEED_MULTIPLIER, difficultyByKey, isTimedTier } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, font, shadow, tints } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import type { DrillState } from "./types";
import { DifficultyIcon } from "./DifficultyIcon";
import { QuizQuestion } from "./QuizQuestion";
import { useCountUp } from "../lib/useCountUp";
import styles from "./InterviewPrep.module.css";
import { SpeedClock } from "./SpeedClock";
import { AUTO_NEXT_MS } from "./quizPrefs";

export function DrillSession({ drill, onAnswer, onNext, onExit, onRestart, autoNext = false }: { drill: DrillState; onAnswer: (i: number) => void; onNext: () => void; onExit: () => void; onRestart?: () => void; autoNext?: boolean }) {
  const { questions, index, answered, correctCount, done } = drill;
  const tier = difficultyByKey(drill.difficulty);
  const perAnswerXp = tier?.xp ?? CORRECT_XP;
  // Tier XP for every correct answer, plus any speed bonus earned on the way.
  const sessionXp = correctCount * perAnswerXp + drill.bonusXp;
  const shownCorrect = useCountUp(done ? correctCount : 0);

  // Auto-next: a correct answer moves on once its +XP has landed. Wrong answers wait for
  // Next, since reading the right answer is the point. Next, Exit or unmount cancel it.
  const answeredCorrectly = !done && answered !== null && answered === questions[index]?.q.correct;
  const advance = useEffectEvent(onNext);
  useEffect(() => {
    if (!autoNext || !answeredCorrectly) return;
    const id = window.setTimeout(advance, AUTO_NEXT_MS);
    return () => window.clearTimeout(id);
  }, [autoNext, answeredCorrectly, index]);

  if (done) {
    const perfect = correctCount === questions.length;
    return (
      <div
        style={{
          background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: 14, boxShadow: shadow.card,
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
        <div style={{ fontSize: font.size.heading, fontWeight: 700, color: colors.textBright, marginBottom: 6 }}>
          {shownCorrect} / {questions.length}
        </div>
        <p style={{ margin: "0 0 20px", fontSize: font.size.body, color: colors.textDim }}>
          {t("prep.drillResult", {
            xp: sessionXp,
            bonus: perfect ? t("prep.perfectBonusSuffix", { bonus: PERFECT_QUIZ_BONUS }) : "",
          })}
        </p>
        {correctCount * 2 < questions.length && (
          <p style={{ margin: "-12px 0 20px", fontSize: font.size.body, color: colors.textFaint }}>{t("prep.drillEncourage")}</p>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {onRestart && (
          <button
            onClick={onRestart}
            style={{
              padding: "9px 18px", background: "transparent", border: `1px solid ${colors.accent}60`,
              borderRadius: 8, color: colors.accentBright, fontSize: font.size.body, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("prep.drillAgain")}
          </button>
        )}
        <button
          onClick={onExit}
          style={{
            padding: "9px 18px", background: colors.accent, border: "none", borderRadius: 8,
            color: colors.onAccent, fontSize: font.size.body, fontWeight: 600, cursor: "pointer",
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
        background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: 14, boxShadow: shadow.card,
        padding: "20px", display: "flex", flexDirection: "column", gap: 12,
        // The header below adapts to the card's width, not the window's.
        containerType: "inline-size",
      }}
    >
      {/* Wraps as two groups on narrow cards. The label group fills its line, which puts the
          difficulty pill at its right edge. Question position lives in the progress bar below. */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px 12px" }}>
        <span style={{ flex: "1 1 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: font.size.caption, fontWeight: 700, color: cur.color, letterSpacing: "0.08em" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            <BrandIcon name="drill" color={cur.color} size={13} />
            {drill.source === "card" ? "QUIZ" : "DRILL"} · {cur.tech}
          </span>
          {tier && (
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: `${tier.color}1A`, border: `1px solid ${tier.color}60`, color: tier.color, letterSpacing: "0.04em" }}>
              <DifficultyIcon tier={tier} size={13} /> {tier.label.toUpperCase()}
            </span>
          )}
        </span>
        <span className={styles.sessionMeta} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
          {correctCount > 0 && (
            // XP earned this run; keyed so it bumps each time it grows.
            <span key={correctCount} className={styles.sessionXp} title={t("prep.sessionXpHint")} style={{ color: colors.successBright, background: tints.successSoft, fontSize: font.size.label }}>
              +{sessionXp} XP
            </span>
          )}
          {isTimedTier(drill.difficulty) && answered === null && <SpeedClock key={`clock-${index}`} shownAt={drill.shownAt} />}
          <button
            onClick={onExit}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px", background: "transparent", border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8, color: colors.textFaint, fontSize: font.size.caption, fontWeight: 600, cursor: "pointer",
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
        xp={perAnswerXp + drill.lastBonus}
        xpNote={drill.lastBonus ? `×${SPEED_MULTIPLIER}` : undefined}
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
              border: `1px dashed ${colors.borderSoft}`,
              borderRadius: 999,
              color: colors.textFaint,
              fontSize: font.size.label,
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

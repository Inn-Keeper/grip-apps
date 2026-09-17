import { CORRECT_XP, PERFECT_QUIZ_BONUS } from "@grip/core/gamification";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, tints } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import type { DrillState } from "./types";
import { DifficultyIcon } from "./DifficultyIcon";

export function DrillSession({ drill, onAnswer, onNext, onExit }: { drill: DrillState; onAnswer: (i: number) => void; onNext: () => void; onExit: () => void }) {
  const { questions, index, answered, correctCount, done } = drill;
  const tier = difficultyByKey(drill.difficulty);
  const perAnswerXp = tier?.xp ?? CORRECT_XP;

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
          {correctCount} / {questions.length}
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: colors.textDim }}>
          {t("prep.drillResult", {
            xp: correctCount * perAnswerXp,
            bonus: perfect ? t("prep.perfectBonusSuffix", { bonus: PERFECT_QUIZ_BONUS }) : "",
          })}
        </p>
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
    );
  }

  const cur = questions[index]!;
  const isCorrect = answered !== null && answered === cur.q.correct;
  const isLast = index === questions.length - 1;

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

      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: colors.text, fontWeight: 750 }}>
        {cur.q.question}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {cur.q.options.map((opt, i) => {
          const isThisCorrect = i === cur.q.correct;
          const isThisChosen = answered === i;

          let bg = colors.surfaceHi;
          let border = `1px solid ${colors.border}`;
          let color = colors.textDim;

          if (answered !== null) {
            if (isThisCorrect) {
              bg = tints.successSoft;
              border = `1px solid ${colors.success}80`;
              color = colors.successBright;
            } else if (isThisChosen && !isThisCorrect) {
              bg = tints.dangerSoft;
              border = `1px solid ${colors.danger}80`;
              color = colors.dangerBright;
            }
          }

          return (
            <button
              key={i}
              onClick={() => answered === null && onAnswer(i)}
              style={{
                textAlign: "left", padding: "10px 12px", background: bg, border, borderRadius: 8,
                color, fontSize: 13, lineHeight: 1.45,
                cursor: answered === null ? "pointer" : "default", transition: "all 0.15s",
              }}
            >
              <span style={{ opacity: 0.5, marginRight: 6 }}>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered !== null && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: isCorrect ? colors.success : colors.danger, fontWeight: 600 }}>
              {isCorrect ? t("prep.correct", { xp: perAnswerXp }) : t("prep.incorrect")}
            </span>
            {cur.link && (
              <a
                href={cur.link}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: colors.accentBright, textDecoration: "none", fontWeight: 500 }}
              >
                {t("prep.docs")}
              </a>
            )}
            {!isCorrect && (
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
            )}
          </span>
          <button
            onClick={onNext}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", background: `${cur.color}25`, border: `1px solid ${cur.color}60`,
              borderRadius: 8, color: cur.color, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {isLast ? t("prep.finish") : t("common.next")}
            <BrandIcon name={isLast ? "check" : "arrowRight"} color={cur.color} size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

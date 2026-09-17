import React from "react";
import { techLinks } from "@grip-apps/core/techLinks";
import { CORRECT_XP } from "@grip-apps/core/gamification";
import { difficultyByKey } from "@grip-apps/core/difficulty";
import { t } from "@grip-apps/core/i18n";
import { colors, layout, tints } from "@grip-apps/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { ACCURACY_GOOD_PCT, type CardState, type PrepItem, type QuizQuestion, type ScoreEntry } from "./types";
import { DifficultyIcon } from "./DifficultyIcon";
import styles from "./InterviewPrep.module.css";

export function Card({ index = 0, item, level, stat, state, onFlip, onBack, onAnswer, onNext }: {
  index?: number;
  item: PrepItem;
  level: string;
  stat: ScoreEntry | undefined;
  state: CardState;
  onFlip: () => void;
  onBack: () => void;
  onAnswer: (i: number) => void;
  onNext: () => void;
}) {
  const { phase, quizIndex, answered, shuffled } = state;
  const flipped = phase === "back";

  return (
    <div
      className={styles.card}
      style={{
        borderRadius: 10,
        animationDelay: `${Math.min(index * 45, 360)}ms`,
        "--prep-card-min-height": `${layout.prepCardMinHeight}px`,
      } as React.CSSProperties}
    >
      {phase === "quiz" && shuffled ? (
        <div className={styles.quiz}>
          <QuizFace
            item={item}
            level={level}
            link={techLinks[item.tech]}
            question={shuffled![quizIndex]!}
            questionNumber={quizIndex + 1}
            total={shuffled.length}
            answered={answered}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        </div>
      ) : (
        <div className={`${styles.cardInner}${flipped ? ` ${styles.isBack}` : ""}`}>
          <div className={styles.cardFace}>
            <FrontFace item={item} level={level} stat={stat} onFlip={onFlip} />
          </div>
          <div className={`${styles.cardFace} ${styles.backFace}`}>
            <BackFace item={item} onBack={onBack} onQuiz={onFlip} />
          </div>
        </div>
      )}
    </div>
  );
}

function FrontFace({ item, level, stat, onFlip }: { item: PrepItem; level: string; stat: ScoreEntry | undefined; onFlip: () => void }) {
  const attempts = stat ? stat.correct + stat.wrong : 0;
  const accuracy = attempts && stat ? Math.round((stat.correct / attempts) * 100) : null;
  const tier = difficultyByKey(level);

  return (
    <div
      onClick={onFlip}
      style={{
        cursor: "pointer",
        background: colors.surface,
        border: `1px solid ${item.color}30`,
        borderRadius: 10,
        padding: "15px 14px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        minHeight: layout.prepCardMinHeight,
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 9 }}>
          <div style={{
            display: "inline-block", padding: "3px 10px",
            background: `${item.color}20`, borderRadius: 999,
            color: item.color, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.04em",
          }}>
            {item.tech}
          </div>
          {tier && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: `${tier.color}1A`, border: `1px solid ${tier.color}55`, color: tier.color, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>
              <DifficultyIcon tier={tier} size={12} /> {tier.label}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: colors.text }}>
          {item.oneliner}
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 10.5, color: colors.textFaint, marginTop: 12 }}>
        <span style={{ color: accuracy === null ? colors.textFaint : accuracy >= ACCURACY_GOOD_PCT ? colors.success : colors.warning }}>
          {accuracy === null ? "" : t("prep.accuracyStat", { pct: accuracy, count: attempts })}
        </span>
        <span style={{ whiteSpace: "nowrap" }}>{t("prep.prepNotes")}</span>
      </div>
    </div>
  );
}

function BackFace({ item, onBack, onQuiz }: { item: PrepItem; onBack: () => void; onQuiz: () => void }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${item.color}18, ${colors.surface})`,
        border: `1px solid ${item.color}50`,
        borderRadius: 10,
        padding: "15px",
        display: "flex", flexDirection: "column", gap: 12,
        minHeight: layout.prepCardMinHeight,
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 10, letterSpacing: "0.06em" }}>
          {t("prep.interviewPrep")}
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {item.prep.map((point) => (
            <li key={point} style={{ fontSize: 12.5, lineHeight: 1.5, color: colors.textDim }}>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            padding: "8px 12px",
            background: "transparent",
            border: `1px solid ${colors.border}`,
            borderRadius: 7,
            color: colors.textFaint,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("prep.flipBack")}
        </button>
        <button
          onClick={onQuiz}
          style={{
            padding: "8px 14px",
            background: `${item.color}25`,
            border: `1px solid ${item.color}60`,
            borderRadius: 7,
            color: item.color,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("prep.takeQuiz")}
        </button>
      </div>
    </div>
  );
}

function QuizFace({ item, level, link, question, questionNumber, total, answered, onAnswer, onNext }: {
  item: PrepItem;
  level: string;
  link: string | undefined;
  question: QuizQuestion;
  questionNumber: number;
  total: number;
  answered: number | null;
  onAnswer: (i: number) => void;
  onNext: () => void;
}) {
  const isCorrect = answered !== null && answered === question.correct;
  const isLast = questionNumber === total;
  const perAnswerXp = difficultyByKey(level)?.xp ?? CORRECT_XP;

  return (
    <div
      style={{
        background: colors.well,
        border: `1px solid ${item.color}40`,
        borderRadius: 10,
        padding: "15px",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: "0.08em" }}>
          {item.tech} · QUIZ
        </div>
        <div style={{ fontSize: 10, color: colors.textFaint }}>
          {questionNumber} / {total}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: colors.text, fontWeight: 700 }}>
        {question.question}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {question.options.map((opt, i) => {
          const isThisCorrect = i === question.correct;
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
                textAlign: "left",
                padding: "9px 12px",
                background: bg,
                border,
                borderRadius: 8,
                color,
                fontSize: 12.5,
                lineHeight: 1.45,
                cursor: answered === null ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              <span style={{ opacity: 0.5, marginRight: 6 }}>
                {String.fromCharCode(65 + i)}.
              </span>
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
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: colors.accentBright, textDecoration: "none", fontWeight: 500 }}
              >
                {t("prep.docs")}
              </a>
            )}
          </span>
          <button
            onClick={onNext}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              background: `${item.color}25`,
              border: `1px solid ${item.color}60`,
              borderRadius: 8,
              color: item.color,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLast ? t("prep.finish") : t("common.next")}
            <BrandIcon name={isLast ? "check" : "arrowRight"} color={item.color} size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

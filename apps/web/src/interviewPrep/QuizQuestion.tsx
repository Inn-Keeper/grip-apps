import React, { useEffect, useRef } from "react";
import { t } from "@grip/core/i18n";
import { colors, tints } from "@grip/core/tokens";
import type { QuizQuestion as Question } from "./types";
import styles from "./QuizQuestion.module.css";

type OptionState = "idle" | "correct" | "wrong" | "dimmed";

const letterFor = (i: number) => String.fromCharCode(65 + i);

function optionState(i: number, answered: number | null, correct: number): OptionState {
  if (answered === null) return "idle";
  if (i === correct) return "correct";
  return i === answered ? "wrong" : "dimmed";
}

// Token values are typed as possibly undefined (noUncheckedIndexedAccess); CSS tolerates that.
const LOOK: Record<OptionState, { bg?: string; border?: string; text?: string }> = {
  idle: { bg: colors.surfaceHi, border: colors.border, text: colors.text },
  dimmed: { bg: colors.surfaceHi, border: colors.border, text: colors.textDim },
  correct: { bg: tints.successSoft, border: `${colors.success}80`, text: colors.successBright },
  wrong: { bg: tints.dangerSoft, border: `${colors.danger}80`, text: colors.dangerBright },
};

// Progress, question, answers and the feedback/next footer — shared by card quizzes and drills.
export function QuizQuestion({ question, questionNumber, total, answered, xp, color, link, large = false, keyboard = false, wrongExtra, onAnswer, onNext }: {
  question: Question;
  questionNumber: number;
  total: number;
  answered: number | null;
  // XP a correct answer earns at the current tier.
  xp: number;
  color: string;
  link?: string;
  large?: boolean;
  // Letter keys answer, for single-quiz views only (several open cards would all react).
  keyboard?: boolean;
  wrongExtra?: React.ReactNode;
  onAnswer: (i: number) => void;
  onNext: () => void;
}) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const isCorrect = answered !== null && answered === question.correct;
  const isLast = questionNumber === total;
  const optionCount = question.options.length;
  const feedback = isCorrect ? t("prep.correct", { xp }) : t("prep.notQuite", { letter: letterFor(question.correct) });

  // After answering, the next step is one Enter away.
  useEffect(() => {
    if (answered !== null) nextRef.current?.focus({ preventScroll: true });
  }, [answered]);

  useEffect(() => {
    if (!keyboard || answered !== null) return undefined;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.metaKey || event.ctrlKey || event.altKey || target?.closest("input, textarea, select, [contenteditable]")) return;
      const index = event.key.toUpperCase().charCodeAt(0) - 65;
      if (event.key.length === 1 && index >= 0 && index < optionCount) onAnswer(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, answered, optionCount, onAnswer]);

  const vars = {
    "--quiz-color": color,
    "--quiz-color-soft": `${color}80`,
    "--quiz-track": colors.surfaceHi,
  } as React.CSSProperties;

  return (
    <div style={{ ...vars, display: "flex", flexDirection: "column", gap: 12 }}>
      <div className={styles.progress} role="img" aria-label={t("prep.questionProgress", { n: questionNumber, total })}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`${styles.segment}${i + 1 === questionNumber ? ` ${styles.segmentCurrent}` : i + 1 < questionNumber ? ` ${styles.segmentDone}` : ""}`}
          />
        ))}
      </div>

      <div key={questionNumber} className={styles.body}>
        <p style={{ margin: 0, fontSize: large ? 16 : 15, lineHeight: 1.55, color: colors.text, fontWeight: large ? 750 : 700 }}>
          {question.question}
        </p>
        <div className={styles.options}>
          {question.options.map((opt, i) => {
            const state = optionState(i, answered, question.correct);
            const look = LOOK[state];
            const marked = state === "correct" || state === "wrong";
            return (
              <button
                key={i}
                type="button"
                disabled={answered !== null}
                onClick={() => onAnswer(i)}
                className={`${styles.option}${state !== "idle" ? ` ${styles[state]}` : ""}`}
                style={{ padding: large ? "10px 12px" : "9px 12px", background: look.bg, border: `1px solid ${look.border}`, color: look.text, fontSize: large ? 13 : 12.5, lineHeight: 1.45 }}
              >
                <span
                  className={styles.badge}
                  aria-hidden="true"
                  style={{
                    border: `1px solid ${state === "idle" ? `${color}60` : look.border}`,
                    background: state === "idle" ? `${color}14` : "transparent",
                    color: state === "idle" ? color : look.text,
                  }}
                >
                  {marked ? (state === "correct" ? "✓" : "✕") : letterFor(i)}
                </span>
                <span>
                  <span style={srOnly}>{letterFor(i)}. </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Always mounted so screen readers announce the result when it appears. */}
      <span role="status" style={srOnly}>{answered === null ? "" : feedback}</span>

      {/* Fixed-height footer: a hint before answering, feedback + next step after — no layout jump. */}
      <div className={styles.footer}>
        {answered === null ? (
          <span style={{ fontSize: 11.5, color: colors.textFaint }}>
            {keyboard ? t("prep.pickAnswerKeys", { last: letterFor(optionCount - 1) }) : t("prep.pickAnswer")}
          </span>
        ) : (
          <>
            <span className={styles.feedback}>
              <span aria-hidden="true" style={{ fontSize: 12, fontWeight: 600, color: isCorrect ? colors.success : colors.danger }}>
                {feedback}
              </span>
              {isCorrect && (
                <span key={questionNumber} className={styles.xp} aria-hidden="true" style={{ color: colors.successBright }}>
                  +{xp}
                </span>
              )}
              {link && (
                <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: colors.accentBright, textDecoration: "none", fontWeight: 500 }}>
                  {t("prep.docs")}
                </a>
              )}
              {!isCorrect && wrongExtra}
            </span>
            <button
              ref={nextRef}
              type="button"
              onClick={onNext}
              className={styles.option}
              style={{
                width: "auto",
                padding: "7px 14px",
                background: `${color}25`,
                border: `1px solid ${color}60`,
                borderRadius: 8,
                color,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {isLast ? t("prep.finish") : t("common.next")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Visually hidden, still read by screen readers (the badge letter is aria-hidden).
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

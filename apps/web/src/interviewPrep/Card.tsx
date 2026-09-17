import React from "react";
import { techLinks } from "@grip/core/techLinks";
import { CORRECT_XP } from "@grip/core/gamification";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, layout } from "@grip/core/tokens";
import { ACCURACY_GOOD_PCT, type CardState, type PrepItem, type QuizQuestion as Question, type ScoreEntry } from "./types";
import { BrandIcon } from "../components/BrandIcon";
import { DifficultyIcon } from "./DifficultyIcon";
import { QuizQuestion } from "./QuizQuestion";
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
      {phase === "result" ? (
        <div className={styles.quiz}>
          <ResultFace item={item} correct={state.runCorrect} total={state.resultTotal ?? 0} xp={state.resultXp ?? 0} />
        </div>
      ) : phase === "quiz" && shuffled ? (
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
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {accuracy !== null && (
          // A bar reads at a glance; the number stays for the exact value.
          <div style={{ height: 3, background: colors.well, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${accuracy}%`, height: "100%", background: accuracy >= ACCURACY_GOOD_PCT ? colors.success : colors.warning }} />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 10.5, color: colors.textFaint }}>
          <span style={{ color: accuracy === null ? colors.textFaint : accuracy >= ACCURACY_GOOD_PCT ? colors.success : colors.warning }}>
            {accuracy === null ? "" : t("prep.accuracyStat", { pct: accuracy, count: attempts })}
          </span>
          <span style={{ whiteSpace: "nowrap" }}>{t("prep.prepNotes")}</span>
        </div>
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
  question: Question;
  questionNumber: number;
  total: number;
  answered: number | null;
  onAnswer: (i: number) => void;
  onNext: () => void;
}) {
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

      <QuizQuestion
        question={question}
        questionNumber={questionNumber}
        total={total}
        answered={answered}
        xp={perAnswerXp}
        color={item.color ?? String(colors.accent)}
        link={link}
        onAnswer={onAnswer}
        onNext={onNext}
      />
    </div>
  );
}

/** The run summary a finished card quiz shows before flipping back. */
function ResultFace({ item, correct, total, xp }: { item: PrepItem; correct: number; total: number; xp: number }) {
  const perfect = total > 0 && correct === total;
  const tone = perfect ? colors.success : correct * 2 >= total ? colors.accent : colors.warning;
  return (
    <div
      role="status"
      style={{
        background: colors.well, border: `1px solid ${tone}60`, borderRadius: 10, padding: "15px",
        minHeight: layout.prepCardMinHeight, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 6, boxSizing: "border-box",
      }}
    >
      <BrandIcon name={perfect ? "rank" : "spark"} color={tone} size={22} />
      <span style={{ fontSize: 18, fontWeight: 800, color: colors.textBright }}>
        {t("prep.cardResult", { correct, total, xp })}
      </span>
      <span style={{ fontSize: 11.5, color: colors.textFaint, textAlign: "center" }}>{item.tech}</span>
    </div>
  );
}

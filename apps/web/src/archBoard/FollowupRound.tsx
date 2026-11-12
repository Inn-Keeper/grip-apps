import { useState } from "react";
import { t } from "@grip/core/i18n";
import type { FollowupRound as SavedRound } from "@grip/core/api";
import { colors } from "../lib/tokens";
import { miniBtn } from "../components/fieldStyles";
import { ErrorText } from "../components/ErrorText";
import styles from "./FollowupRound.module.css";
import spinner from "../components/Spinner.module.css";

// Same wording and colours as the talk-track verdicts.
const VERDICTS = {
  covered: { color: colors.successBright, key: "talk.verdictCovered" },
  thin: { color: colors.warningBright, key: "talk.verdictThin" },
  missing: { color: colors.textFaint, key: "talk.verdictMissing" },
} as const;

// The defence round: written answers to the interviewer's follow-ups, graded in one call.
export function FollowupRound({ questions, saved, grading, error, onGrade }: {
  questions: string[];
  /** The last graded round for this reasoning, if any. */
  saved?: SavedRound;
  grading: boolean;
  error: Error | null;
  onGrade: (followups: { question: string; answer: string }[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => Object.fromEntries((saved?.items ?? []).map((item) => [item.question, item.answer]))
  );
  const followups = questions.map((question) => ({ question, answer: answers[question] ?? "" }));
  // Feedback belongs to the exact answers that were sent.
  const graded = new Map((saved?.items ?? []).map((item) => [item.question, item]));
  // One question on screen at a time; the rail is narrow and six boxes bury the talk track.
  const [index, setIndex] = useState(0);
  const current = followups[Math.min(index, followups.length - 1)] ?? { question: "", answer: "" };
  const fresh = Boolean(saved) && followups.every(({ question, answer }) => graded.get(question)?.answer === answer);
  const result = fresh ? graded.get(current.question) : undefined;

  return (
    <section className={styles.round} aria-labelledby="followup-round-title">
      <h3 id="followup-round-title" className={styles.title}>{t("followups.title")}</h3>
      <p className={styles.hint}>{t("followups.hint")}</p>
      <p className={styles.hint}>{t("followups.progress", { n: index + 1, total: followups.length })}</p>
      <label className={styles.item}>
        <span>{current.question}</span>
        <textarea
          className={styles.answer}
          value={current.answer}
          maxLength={4000}
          onChange={(event) => setAnswers({ ...answers, [current.question]: event.target.value })}
        />
        {result && (
          <span className={styles.feedback}>
            <strong style={{ color: VERDICTS[result.verdict].color }}>{t(VERDICTS[result.verdict].key)}</strong>
            {result.answer.trim() ? ` · ${result.gap}` : ""}
          </span>
        )}
      </label>
      <div className={styles.actions}>
        <button type="button" className="tap" disabled={index === 0} onClick={() => setIndex(index - 1)} style={miniBtn(colors.textDim ?? "")}>
          {t("followups.previous")}
        </button>
        <button type="button" className="tap" disabled={index >= followups.length - 1} onClick={() => setIndex(index + 1)} style={miniBtn(colors.textDim ?? "")}>
          {t("common.next")}
        </button>
        <button
          type="button"
          className={`tap ${spinner.withSpinner}`}
          aria-busy={grading}
          disabled={grading || !followups.some(({ answer }) => answer.trim())}
          onClick={() => onGrade(followups)}
          style={miniBtn(colors.accentBright ?? "")}
        >
          {grading && <span aria-hidden="true" className={spinner.spinner} />}
          {grading ? t("talk.grading") : t("followups.gradeAction")}
        </button>
      </div>
      {error && <ErrorText>{`${t("talk.gradeFailed")}: ${error.message}`}</ErrorText>}
      {/* Always mounted so the score is announced when it arrives. */}
      <p role="status" className={styles.score}>{fresh && saved ? t("followups.score", { score: saved.score }) : ""}</p>
    </section>
  );
}

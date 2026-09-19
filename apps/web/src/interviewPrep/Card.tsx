import React from "react";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@grip/core/tokens";
import { ACCURACY_GOOD_PCT, type PrepItem, type ScoreEntry } from "./types";
import { DifficultyIcon } from "./DifficultyIcon";
import styles from "./InterviewPrep.module.css";
import { quietText } from "../components/fieldStyles";

// A study card: what the tech is, the interview notes and its quiz, all on one face.
// The quiz opens as a focused session in the main column, so the card never changes size.
export function Card({ index = 0, item, level, stat, loading, onQuiz }: {
  index?: number;
  item: PrepItem;
  level: string;
  stat: ScoreEntry | undefined;
  // This card's quiz is loading: the button that started it says so.
  loading: boolean;
  onQuiz: () => void;
}) {
  const attempts = stat ? stat.correct + stat.wrong : 0;
  const accuracy = attempts && stat ? Math.round((stat.correct / attempts) * 100) : null;
  const tier = difficultyByKey(level);

  return (
    <div
      className={styles.card}
      style={{
        animationDelay: `${Math.min(index * 45, 360)}ms`,
        "--card-shadow": shadow.card,
        "--card-shadow-hover": shadow.cardHover,
        background: colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 10,
        padding: "15px 14px",
        display: "flex", flexDirection: "column",
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 9 }}>
        <div style={{
          display: "inline-block", padding: "3px 10px",
          background: `${item.color}20`, borderRadius: 999,
          color: item.color, fontSize: font.size.label, fontWeight: 700,
          letterSpacing: "0.04em",
        }}>
          {item.tech}
        </div>
        {tier && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: `${tier.color}1A`, border: `1px solid ${tier.color}55`, color: tier.color, fontSize: font.size.caption, fontWeight: 800, whiteSpace: "nowrap" }}>
            <DifficultyIcon tier={tier} size={12} /> {tier.label}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: font.size.body, lineHeight: 1.55, color: colors.text }}>
        {item.oneliner}
      </p>
      {/* Quiet reference text: smaller and dimmer than the one-liner, so the card leads with what the tech is. */}
      <ul style={{ margin: "10px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        {item.prep.map((point) => (
          <li key={point} style={{ fontSize: font.size.small, lineHeight: 1.45, color: quietText }}>
            {point}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {accuracy !== null && (
          // A bar reads at a glance; the number stays for the exact value.
          <div style={{ height: 3, background: colors.well, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${accuracy}%`, height: "100%", background: accuracy >= ACCURACY_GOOD_PCT ? colors.success : colors.warning }} />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 32 }}>
          <span style={{ fontSize: font.size.label, color: accuracy === null ? colors.textFaint : accuracy >= ACCURACY_GOOD_PCT ? colors.success : colors.warning }}>
            {accuracy === null ? "" : t("prep.accuracyStat", { pct: accuracy, count: attempts })}
          </span>
          <button
            type="button"
            className={styles.cardQuiz}
            onClick={onQuiz}
            disabled={loading}
            aria-busy={loading}
            style={{
              padding: "7px 14px",
              background: `${item.color}25`,
              border: `1px solid ${item.color}60`,
              borderRadius: 7,
              color: item.color,
              fontSize: font.size.small,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? t("common.loading") : t("prep.takeQuiz")}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, layout, font, shadow } from "@grip/core/tokens";
import { ACCURACY_GOOD_PCT, type PrepItem, type ScoreEntry } from "./types";
import { DifficultyIcon } from "./DifficultyIcon";
import styles from "./InterviewPrep.module.css";

// A study card: front (what it is) and back (interview notes). The quiz opens as a
// focused session in the main column, so the card never changes size.
export function Card({ index = 0, item, level, stat, flipped, loading, onFlip, onBack, onQuiz }: {
  index?: number;
  item: PrepItem;
  level: string;
  stat: ScoreEntry | undefined;
  flipped: boolean;
  // This card's quiz is loading: the button that started it says so.
  loading: boolean;
  onFlip: () => void;
  onBack: () => void;
  onQuiz: () => void;
}) {
  return (
    <div
      className={styles.card}
      style={{
        borderRadius: 10,
        animationDelay: `${Math.min(index * 45, 360)}ms`,
        "--prep-card-min-height": `${layout.prepCardMinHeight}px`,
        "--card-shadow": shadow.card,
        "--card-shadow-hover": shadow.cardHover,
      } as React.CSSProperties}
    >
      <div className={`${styles.cardInner}${flipped ? ` ${styles.isBack}` : ""}`}>
        <div className={styles.cardFace}>
          <FrontFace item={item} level={level} stat={stat} onFlip={onFlip} />
        </div>
        <div className={`${styles.cardFace} ${styles.backFace}`}>
          <BackFace item={item} loading={loading} onBack={onBack} onQuiz={onQuiz} />
        </div>
      </div>
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
        border: `1px solid ${colors.borderSoft}`,
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
      </div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {accuracy !== null && (
          // A bar reads at a glance; the number stays for the exact value.
          <div style={{ height: 3, background: colors.well, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${accuracy}%`, height: "100%", background: accuracy >= ACCURACY_GOOD_PCT ? colors.success : colors.warning }} />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: font.size.label, color: colors.textFaint }}>
          <span style={{ color: accuracy === null ? colors.textFaint : accuracy >= ACCURACY_GOOD_PCT ? colors.success : colors.warning }}>
            {accuracy === null ? "" : t("prep.accuracyStat", { pct: accuracy, count: attempts })}
          </span>
          <span style={{ whiteSpace: "nowrap" }}>{t("prep.prepNotes")}</span>
        </div>
      </div>
    </div>
  );
}

function BackFace({ item, loading, onBack, onQuiz }: { item: PrepItem; loading: boolean; onBack: () => void; onQuiz: () => void }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${item.color}18, ${colors.surface})`,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 10,
        padding: "15px",
        display: "flex", flexDirection: "column", gap: 12,
        minHeight: layout.prepCardMinHeight,
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ fontSize: font.size.label, fontWeight: 700, color: item.color, marginBottom: 10, letterSpacing: "0.06em" }}>
          {t("prep.interviewPrep")}
        </div>
        <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {item.prep.map((point) => (
            <li key={point} style={{ fontSize: font.size.body, lineHeight: 1.5, color: colors.textDim }}>
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
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 7,
            color: colors.textFaint,
            fontSize: font.size.small,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("prep.flipBack")}
        </button>
        <button
          onClick={onQuiz}
          disabled={loading}
          aria-busy={loading}
          style={{
            padding: "8px 14px",
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
  );
}


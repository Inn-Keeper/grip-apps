import React, { useEffect, useRef, useState } from "react";
import { RANKS, rankForXp } from "@grip/core/gamification";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import { AccuracyChart } from "./AccuracyChart";
import type { AccuracyPoint, Readiness, Scores, Summary } from "./types";
import { LevelSelector } from "./LevelSelector";
import { QuizSizeSelector } from "./QuizSizeSelector";
import { useCountUp } from "./useCountUp";
import styles from "./InterviewPrep.module.css";

// Status first (readiness, rank), then signal, then the practice settings folded away.
export function PrepRightRail({ accuracy, level, onLevel, readiness, scores, summary, quizSize, poolSize, onQuizSize }: {
  accuracy: AccuracyPoint[];
  level: string;
  onLevel: (key: string) => void;
  readiness: Readiness | null;
  scores: Scores;
  summary: Summary;
  quizSize: number | null;
  poolSize: number | null;
  onQuizSize: (v: number | null) => void;
}) {
  // Flash the bar when XP lands, so earning it is visible outside the quiz.
  const previousXp = useRef(scores.xp);
  const [gained, setGained] = useState(false);
  useEffect(() => {
    if (scores.xp > previousXp.current) {
      setGained(true);
      const done = window.setTimeout(() => setGained(false), 700);
      previousXp.current = scores.xp;
      return () => window.clearTimeout(done);
    }
    previousXp.current = scores.xp;
    return undefined;
  }, [scores.xp]);

  const rank = rankForXp(scores.xp) ?? RANKS[0]!;
  const next = RANKS[RANKS.indexOf(rank) + 1];
  const progress = next ? Math.round(((scores.xp - rank.min) / (next.min - rank.min)) * 100) : 100;
  const strongest = summary.ranked.slice(0, 4);
  const weakest = [...summary.ranked].reverse().slice(0, 4);

  return (
    <>
      <WorkspacePanel>
        {readiness && <ReadinessBlock readiness={readiness} />}
        <WorkspaceTitle
          icon={<BrandIcon name="rank" color={colors.accentBright} size={17} />}
          title={t(`enum.rank.${rank.name}` as Parameters<typeof t>[0])}
          subtitle={t("prep.xpEarned", { xp: scores.xp })}
        />
        <GlowBar pct={progress} gained={gained} marginTop={14} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 9, color: colors.textFaint, fontSize: font.size.label }}>
          <span>{t("prep.answered", { count: summary.attempts })}</span>
          <span>{next ? t("prep.xpToNext", { xp: next.min - scores.xp, rank: t(`enum.rank.${next.name}` as Parameters<typeof t>[0]) }) : t("prep.topRank")}</span>
        </div>
      </WorkspacePanel>

      <AccuracyChart points={accuracy} compact />

      <WorkspacePanel>
        <WorkspaceTitle
          icon={<BrandIcon name="accuracy" color={colors.successBright} size={17} />}
          title={t("prep.signal")}
          subtitle={t("prep.signalSubtitle")}
        />
        <RailList title={t("prep.strongest2")} icon="arrowUp" items={strongest} color={colors.successBright ?? ""} />
        <RailList title={t("prep.needsReps")} icon="arrowDown" items={weakest} color={colors.warningBright ?? ""} />
      </WorkspacePanel>

      {/* Native disclosure; the summary keeps the current tier and size visible while folded. */}
      <details className={styles.settings} style={{ "--settings-focus": colors.accentBright } as React.CSSProperties}>
        <summary
          className={styles.settingsSummary}
          style={{ background: colors.surface, border: `1px solid ${colors.borderSoft}`, boxShadow: shadow.card }}
        >
          <BrandIcon name="drill" color={colors.accentBright} size={17} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", color: colors.textBright, fontSize: font.size.body, fontWeight: 800 }}>{t("prep.practiceSettings")}</span>
            <span style={{ display: "block", marginTop: 4, color: colors.textFaint, fontSize: font.size.label }}>
              {t("prep.settingsSummary", { level: difficultyByKey(level)?.label ?? level, size: quizSize ?? t("prep.all") })}
            </span>
          </span>
          <span className={styles.settingsChevron} aria-hidden="true">
            <BrandIcon name="arrowDown" color={colors.textDim} size={14} />
          </span>
        </summary>
        <div className={styles.settingsBody}>
          <LevelSelector level={level} onLevel={onLevel} />
          <QuizSizeSelector quizSize={quizSize} poolSize={poolSize} onQuizSize={onQuizSize} />
        </div>
      </details>
    </>
  );
}

// The headline number: how ready the chosen set of techs is. Untested techs count as 0.
function ReadinessBlock({ readiness }: { readiness: Readiness }) {
  // Number and bar fill together on open (same 1.1s ease-out), then follow changes.
  const shown = useCountUp(readiness.pct, 1100);
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.borderSoft}` }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={{ color: colors.textDim, fontSize: font.size.small, fontWeight: 700 }}>{readiness.label}</span>
        <span
          className={styles.readinessNumber}
          style={{
            // Teal gradient text; the deep end stops short so the bottom edge keeps contrast.
            background: `linear-gradient(180deg, ${colors.accent} 35%, ${colors.accentDeep} 140%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            fontSize: font.size.hero,
            fontWeight: 800,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            "--land-glow": `${colors.accentBright}99`,
          } as React.CSSProperties}
        >
          {shown}%
        </span>
      </div>
      <GlowBar pct={readiness.pct} marginTop={12} />
      <p style={{ margin: "8px 0 0", color: colors.textFaint, fontSize: font.size.label }}>
        {t("prep.readinessHint", { count: readiness.count })}
      </p>
    </div>
  );
}

// Deep-teal gradient bar that lifts off its track: grows on open, blinks when it lands.
// `gained` flashes the whole track (not the fill, so the grow-in never restarts).
function GlowBar({ pct, gained = false, marginTop }: { pct: number; gained?: boolean; marginTop: number }) {
  return (
    // No overflow clip on the track, so the fill's glow can lift off it.
    <div className={gained ? styles.xpBarGained : undefined} style={{ height: 10, background: colors.well, borderRadius: 999, marginTop }}>
      <div
        className={styles.glowFill}
        style={{
          "--land-glow": `${colors.accentBright}99`,
          width: `${pct}%`,
          height: "100%",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${colors.accentDeep}, ${colors.accent})`,
          boxShadow: `inset 0 1px 0 #FFFFFF26, 0 4px 12px -2px ${colors.accent}66`,
        } as React.CSSProperties}
      />
    </div>
  );
}

function RailList({ color, icon, items, title }: { color: string; icon: string; items: { tech: string; acc: number; n: number }[]; title: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: colors.textDim, fontSize: font.size.label, fontWeight: 800, marginBottom: 8 }}>
        <BrandIcon name={icon} color={color} size={12} />
        {title}
      </div>
      {items.length === 0 ? (
        <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.label, lineHeight: 1.5 }}>{t("prep.signalEmpty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {items.map((item, index) => (
            <div key={item.tech} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: font.size.small }}>
              <span style={{ color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.tech}</span>
              <span style={{ color, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}><CountUp value={item.acc} durationMs={1600 + index * 200} />%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// A number that counts up from 0 on open (for list rows, where the hook can't be called per item).
// Signal rows get longer durations down the list, so they settle one after another.
function CountUp({ value, durationMs }: { value: number; durationMs: number }) {
  return <>{useCountUp(value, durationMs)}</>;
}

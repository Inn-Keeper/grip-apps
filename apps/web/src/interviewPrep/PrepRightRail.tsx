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
import { AutoNextToggle } from "./AutoNextToggle";
import { CountUp, GlowBar } from "../components/GlowBar";
import { HeadlineMetric } from "../components/HeadlineMetric";
import styles from "./InterviewPrep.module.css";

// Status first (readiness, rank), then signal, then the practice settings folded away.
export function PrepRightRail({ accuracy, level, onLevel, readiness, scores, summary, quizSize, poolSize, onQuizSize, autoNext, onAutoNext }: {
  accuracy: AccuracyPoint[];
  level: string;
  onLevel: (key: string) => void;
  readiness: Readiness | null;
  scores: Scores;
  summary: Summary;
  quizSize: number | null;
  poolSize: number | null;
  onQuizSize: (v: number | null) => void;
  autoNext: boolean;
  onAutoNext: (value: boolean) => void;
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
        {readiness && (
          // The screen's headline: how ready the chosen set of techs is. Untested techs count as 0.
          <HeadlineMetric label={readiness.label} value={readiness.pct} unit="%" pct={readiness.pct} hint={t("prep.readinessHint", { count: readiness.count })} info={t("prep.readinessInfo")} />
        )}
        <WorkspaceTitle
          icon={<BrandIcon name="rank" color={colors.accentBright} size={17} />}
          title={t(`enum.rank.${rank.name}` as Parameters<typeof t>[0])}
          subtitle={t("prep.xpEarned", { xp: scores.xp })}
        />
        <GlowBar pct={progress} flash={gained} marginTop={14} />
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
        />
        <RailList title={t("prep.strongest2")} icon="arrowUp" items={strongest} color={colors.successBright ?? ""} />
        <RailList title={t("prep.needsReps")} icon="arrowDown" items={weakest} color={colors.warningBright ?? ""} />
      </WorkspacePanel>

      {/* Native disclosure, one card: the summary keeps the current values visible while
          folded, and the settings open as sections inside it (rule 5). */}
      <details
        className={styles.settings}
        style={{
          "--settings-focus": colors.accentBright,
          "--settings-divider": colors.borderSoft,
          background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: 8, boxShadow: shadow.card,
        } as React.CSSProperties}
      >
        <summary className={styles.settingsSummary}>
          <BrandIcon name="drill" color={colors.accentBright} size={17} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", color: colors.textBright, fontSize: font.size.body, fontWeight: 800 }}>{t("prep.practiceSettings")}</span>
            <span style={{ display: "block", marginTop: 4, color: colors.textFaint, fontSize: font.size.label }}>
              {t("prep.settingsSummary", { level: difficultyByKey(level)?.label ?? level, size: quizSize ?? t("prep.all") })}
              {autoNext && <span style={{ whiteSpace: "nowrap" }}>{` · ${t("prep.autoNext")}`}</span>}
            </span>
          </span>
          <span className={styles.settingsChevron} aria-hidden="true">
            <BrandIcon name="arrowDown" color={colors.textDim} size={14} />
          </span>
        </summary>
        <div className={styles.settingsBody}>
          <LevelSelector level={level} onLevel={onLevel} />
          <QuizSizeSelector quizSize={quizSize} poolSize={poolSize} onQuizSize={onQuizSize} />
          <AutoNextToggle autoNext={autoNext} onAutoNext={onAutoNext} />
        </div>
      </details>
    </>
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


import { t } from "@grip/core/i18n";
import type { CSSProperties } from "react";
import { colors, font, shadow } from "@grip/core/tokens";
import { useCountUp } from "./useCountUp";
import styles from "./InterviewPrep.module.css";

// Same rhythm as the glow bars: the line draws in over this long, then the latest point blinks.
const DRAW_MS = 1100;

const HEIGHT = 90;
const WIDTH = 600; // viewBox units; scales to container width
const PAD_X = 12;
const PAD_Y = 14;

type AccuracyPoint = { date: string; accuracy: number };

// SVG twin of the mobile Skia chart: cumulative accuracy per day.
export function AccuracyChart({ points, compact = false }: { points: AccuracyPoint[]; compact?: boolean }) {
  const latest = points.at(-1);
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;
  const maxIndex = Math.max(1, points.length - 1);
  const dots = points.map((point, index) => ({
    key: point.date,
    x: PAD_X + (index / maxIndex) * innerW,
    y: PAD_Y + (1 - point.accuracy) * innerH,
  }));
  const path = dots.map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`).join(" ");
  const latestPct = latest ? Math.round(latest.accuracy * 100) : 0;
  const shownPct = useCountUp(latestPct, DRAW_MS);

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: compact ? 8 : 12,
        boxShadow: shadow.card,
        padding: compact ? "12px 14px 8px" : "12px 14px",
        marginBottom: compact ? 0 : 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: font.size.small, fontWeight: 700, color: colors.textBright }}>{t("accuracy.title")}</div>
          <div style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("accuracy.subtitle")}</div>
        </div>
        <span
          className={latest ? styles.readinessNumber : undefined}
          style={{
            fontSize: font.size.body,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            color: latest && latest.accuracy >= 0.7 ? colors.success : colors.warning,
            "--land-glow": `${latest && latest.accuracy >= 0.7 ? colors.success : colors.warning}99`,
          } as CSSProperties}
        >
          {latest ? `${shownPct}%` : "--"}
        </span>
      </div>

      {points.length < 2 ? (
        <div style={{ height: compact ? 64 : HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textFaint, fontSize: font.size.label }}>
          {t("accuracy.empty")}
        </div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: compact ? 64 : HEIGHT, display: "block" }}>
          <path
            d={`M ${PAD_X} ${PAD_Y} L ${PAD_X} ${HEIGHT - PAD_Y} L ${WIDTH - PAD_X} ${HEIGHT - PAD_Y}`}
            fill="none"
            stroke={colors.borderSoft}
            strokeWidth="1"
          />
          {/* pathLength=1 lets the CSS draw-in work for any line length. */}
          <path d={path} pathLength={1} className={styles.chartLine} fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinejoin="round" />
          {dots.map((dot, index) => {
            const last = index === dots.length - 1;
            return (
              <circle
                key={dot.key}
                cx={dot.x}
                cy={dot.y}
                r={last ? 4 : 2.5}
                fill={last ? colors.success : colors.accent}
                // Each dot appears as the line reaches it; the last one blinks when the line lands.
                className={last ? `${styles.chartDot} ${styles.chartDotLast}` : styles.chartDot}
                style={{ animationDelay: last ? `${DRAW_MS - 150}ms, ${DRAW_MS}ms` : `${(index / maxIndex) * DRAW_MS - 150}ms`, "--land-glow": `${colors.success}99` } as CSSProperties}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

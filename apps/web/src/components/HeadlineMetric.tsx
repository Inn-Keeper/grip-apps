import type { CSSProperties } from "react";
import { InfoTip } from "./InfoTip";
import { colors, font } from "@grip/core/tokens";
import { useCountUp } from "../lib/useCountUp";
import { GlowBar } from "./GlowBar";
import styles from "./Metric.module.css";

type HeadlineMetricProps = {
  // What the number covers, e.g. "Ready for Acme" (rule 17).
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  // Bar fill, 0–100.
  pct: number;
  hint?: string;
  // How the number is worked out, behind an ⓘ instead of on screen (rule 20).
  info?: string;
};

// A screen's one headline number: teal count-up over a glow bar, landing together at ~1.1s.
export function HeadlineMetric({ label, value, unit = "", decimals = 0, pct, hint, info }: HeadlineMetricProps) {
  const scale = 10 ** decimals;
  const shown = (useCountUp(Math.round(value * scale), 1100) / scale).toFixed(decimals);
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.borderSoft}` }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={{ color: colors.textDim, fontSize: font.size.small, fontWeight: 700 }}>{label}</span>
        <span
          className={styles.landNumber}
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
            whiteSpace: "nowrap",
            "--land-glow": `${colors.accentBright}99`,
          } as CSSProperties}
        >
          {shown}
          {unit}
        </span>
      </div>
      <GlowBar pct={pct} marginTop={12} />
      {(hint || info) && (
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 6 }}>
          {hint && <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.label }}>{hint}</p>}
          {info && <InfoTip>{info}</InfoTip>}
        </div>
      )}
    </div>
  );
}

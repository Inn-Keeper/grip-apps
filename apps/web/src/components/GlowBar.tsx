import type { CSSProperties } from "react";
import { colors } from "@grip/core/tokens";
import { useCountUp } from "../lib/useCountUp";
import styles from "./Metric.module.css";

// Deep-teal gradient bar that lifts off its track: grows on open, blinks when it lands.
// `flash` flashes the whole track (not the fill, so the grow-in never restarts).
export function GlowBar({ pct, flash = false, marginTop = 0 }: { pct: number; flash?: boolean; marginTop?: number }) {
  return (
    // No overflow clip on the track, so the fill's glow can lift off it.
    <div className={flash ? styles.trackFlash : undefined} style={{ height: 10, background: colors.well, borderRadius: 999, marginTop }}>
      <div
        className={styles.glowFill}
        style={{
          "--land-glow": `${colors.accentBright}99`,
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: "100%",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${colors.accentDeep}, ${colors.accent})`,
          boxShadow: `inset 0 1px 0 #FFFFFF26, 0 4px 12px -2px ${colors.accent}66`,
        } as CSSProperties}
      />
    </div>
  );
}

// A number that counts up from 0 on open (for list rows, where the hook can't be called per item).
export function CountUp({ value, durationMs = 1100, decimals = 0 }: { value: number; durationMs?: number; decimals?: number }) {
  const scale = 10 ** decimals;
  return <>{(useCountUp(Math.round(value * scale), durationMs) / scale).toFixed(decimals)}</>;
}

import { useEffect, useRef, useState } from "react";
import {
  DESIGN_PHASES,
  ROUND_MINUTES,
  formatClock,
  phaseAt,
  roundProgress,
} from "@grip/core/designTimer";
import { t } from "@grip/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./DesignTimer.module.css";

// One tick per second is all a MM:SS clock can show.
const TICK_MS = 1000;

const sectionLabels = (ids: string[]) =>
  ids.map((id) => TALK_TRACK_SECTIONS.find((s) => s.id === id)?.label ?? id).join(" · ");

export function DesignTimer() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  // Wall-clock anchor, so a backgrounded tab resumes at the right time rather
  // than counting the ticks it missed.
  const anchorRef = useRef<{ startedAt: number; before: number } | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const anchor = anchorRef.current;
      if (anchor) setElapsedMs(anchor.before + (Date.now() - anchor.startedAt));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  const start = () => {
    anchorRef.current = { startedAt: Date.now(), before: elapsedMs };
    setRunning(true);
  };

  const pause = () => {
    const anchor = anchorRef.current;
    if (anchor) setElapsedMs(anchor.before + (Date.now() - anchor.startedAt));
    anchorRef.current = null;
    setRunning(false);
  };

  const reset = () => {
    anchorRef.current = null;
    setRunning(false);
    setElapsedMs(0);
  };

  const { phase, index, phaseRemainingMs, overrun } = phaseAt(elapsedMs);
  const { remainingMs } = roundProgress(elapsedMs);
  const started = elapsedMs > 0 || running;
  const clockColor = overrun ? colors.danger : phaseRemainingMs <= 60_000 && started ? colors.warning : colors.textBright;

  // A rail panel: the rails are sticky, so the clock stays in view without pinning itself.
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 14,
        borderRadius: 8,
        // Overtime is informative, so it earns a light edge (rule 22).
        border: `1px solid ${overrun ? `${colors.danger}55` : colors.borderSoft}`,
        background: colors.surface,
        boxShadow: shadow.card,
      }}
    >
      {/* Live signal: only while the clock is actually ticking. */}
      {running && (
        <div aria-hidden className={styles.sweep} style={{ ["--timer-sweep-color" as string]: overrun ? colors.dangerBright : colors.warningBright }} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: font.size.display, fontWeight: 800, color: clockColor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {overrun ? formatClock(-(elapsedMs - ROUND_MINUTES * 60_000)) : formatClock(remainingMs)}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: font.size.small, fontWeight: 700, color: overrun ? colors.dangerBright : colors.accentBright }}>
            {overrun ? t("timer.overtime") : started ? phase.label : t("timer.round", { minutes: ROUND_MINUTES })}
          </span>
          <span style={{ fontSize: font.size.label, color: colors.textFaint }}>
            {started ? sectionLabels(phase.sectionIds) : t("timer.idleHint")}
          </span>
        </div>
      </div>

      {/* Phase strip: each segment is proportional to its minutes. */}
      <div style={{ display: "flex", gap: 3, height: 8, marginTop: 12 }}>
        {DESIGN_PHASES.map((p, i) => (
          <div
            key={p.id}
            title={`${p.label} · ${p.minutes} min`}
            style={{
              flex: p.minutes,
              borderRadius: 3,
              background: i < index ? colors.accent : i === index && started ? colors.accentBright : colors.borderSoft,
              opacity: i === index && started ? 1 : i < index ? 0.55 : 1,
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={running ? pause : start}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 14px", background: running ? "transparent" : colors.accent,
            border: `1px solid ${running ? colors.borderSoft : colors.accent}`, borderRadius: 8,
            color: running ? colors.textDim : colors.onAccent, fontSize: font.size.small, fontWeight: 700, cursor: "pointer",
          }}
        >
          <BrandIcon name={running ? "close" : "spark"} color={running ? colors.textDim : colors.onAccent} size={13} />
          {running ? t("timer.pause") : started ? t("timer.resume") : t("timer.start")}
        </button>
        {started && (
          <button
            type="button"
            onClick={reset}
            style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${colors.borderSoft}`, borderRadius: 8, color: colors.textDim, fontSize: font.size.small, fontWeight: 700, cursor: "pointer" }}
          >
            {t("timer.reset")}
          </button>
        )}
      </div>
    </div>
  );
}

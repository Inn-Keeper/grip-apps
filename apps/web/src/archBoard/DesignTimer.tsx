import { useEffect, useRef, useState } from "react";
import {
  DESIGN_PHASES,
  ROUND_MINUTES,
  formatClock,
  phaseAt,
  roundProgress,
} from "@grip-apps/core/designTimer";
import { t } from "@grip-apps/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip-apps/core/talkTrack";
import { colors, layout } from "@grip-apps/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { PAGE_PADDING_X } from "./constants";
import styles from "./DesignTimer.module.css";

// One tick per second is all a MM:SS clock can show.
const TICK_MS = 1000;

// Sits directly under the app header so the clock stays visible while you
// scroll down to the talk track.
const STICKY_TOP = layout.webHeaderHeight;

const sectionLabels = (ids: string[]) =>
  ids.map((id) => TALK_TRACK_SECTIONS.find((s) => s.id === id)?.label ?? id).join(" · ");

export function DesignTimer() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
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

  // "Is it stuck?" isn't expressible in CSS, so a zero-height sentinel sitting
  // where the bar rests reports it: once the sentinel passes above the sticky
  // offset, the bar is pinned and goes full-bleed.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => setStuck(!entries[0]?.isIntersecting), {
      rootMargin: `-${STICKY_TOP + 1}px 0px 0px 0px`,
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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

  const borderColor = overrun ? `${colors.danger}55` : colors.border;
  // Pinned, the bar is the live element on screen, so it gets a warm edge.
  // Overrun still escalates to red — amber marks "active", red marks "late".
  const pinnedBorder = overrun ? `${colors.danger}B3` : `${colors.warning}80`;

  return (
    <>
      <div ref={sentinelRef} aria-hidden style={{ height: 0 }} />
      <div
        style={{
          position: "sticky",
          top: STICKY_TOP,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 10,
          transition: "margin 120ms ease, border-radius 120ms ease, box-shadow 120ms ease",
          // Pinned, it spans the viewport by cancelling the page's side padding,
          // squares off, and lifts — translucent over a blur so the board reading
          // through it makes the elevation legible, same idiom as the app header.
          // At rest it's a flat inset card like the panels below it.
          ...(stuck
            ? {
                marginLeft: -PAGE_PADDING_X,
                marginRight: -PAGE_PADDING_X,
                padding: `10px ${PAGE_PADDING_X}px`,
                borderRadius: 0,
                borderTop: "none",
                borderBottom: `2px solid ${pinnedBorder}`,
                background: `${colors.surface}E6`,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                // Black, not a token tint: the board behind is already near-black,
                // so a tinted shadow reads as no shadow at all.
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.55)",
              }
            : {
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${borderColor}`,
                background: colors.surface,
                boxShadow: "none",
              }),
        }}
      >
      {/* Live signal: only while the clock is actually ticking. */}
      {stuck && running && (
        <div
          aria-hidden
          className={styles.sweep}
          style={{ ["--timer-sweep-color" as string]: overrun ? colors.dangerBright : colors.warningBright }}
        />
      )}

      <span
        style={{ fontSize: 22, fontWeight: 700, color: clockColor, fontVariantNumeric: "tabular-nums", minWidth: 78 }}
      >
        {overrun ? formatClock(-(elapsedMs - ROUND_MINUTES * 60_000)) : formatClock(remainingMs)}
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 150 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: overrun ? colors.dangerBright : colors.accentBright }}>
          {overrun ? t("timer.overtime") : started ? phase.label : t("timer.round", { minutes: ROUND_MINUTES })}
        </span>
        <span style={{ fontSize: 11, color: colors.textFaint }}>
          {started ? sectionLabels(phase.sectionIds) : t("timer.idleHint")}
        </span>
      </div>

      {/* Phase strip: each segment is proportional to its minutes. */}
      <div style={{ display: "flex", flex: 1, minWidth: 200, gap: 3, height: 8 }}>
        {DESIGN_PHASES.map((p, i) => (
          <div
            key={p.id}
            title={`${p.label} · ${p.minutes} min`}
            style={{
              flex: p.minutes,
              borderRadius: 3,
              background: i < index ? colors.accent : i === index && started ? colors.accentBright : colors.border,
              opacity: i === index && started ? 1 : i < index ? 0.55 : 1,
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={running ? pause : start}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", background: running ? "transparent" : colors.accent,
            border: `1px solid ${running ? colors.border : colors.accent}`, borderRadius: 8,
            color: running ? colors.textDim : colors.onAccent, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          <BrandIcon name={running ? "close" : "spark"} color={running ? colors.textDim : colors.onAccent} size={13} />
          {running ? t("timer.pause") : started ? t("timer.resume") : t("timer.start")}
        </button>
        {started && (
          <button
            onClick={reset}
            style={{
              padding: "7px 14px", background: "transparent", border: `1px solid ${colors.border}`,
              borderRadius: 8, color: colors.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("timer.reset")}
          </button>
        )}
        </div>
      </div>
    </>
  );
}

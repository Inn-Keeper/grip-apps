import { useEffect, useRef, useState } from "react";
import { ROUND_MINUTES, phaseAt, roundProgress } from "@grip/core/designTimer";

// One tick per second is all a MM:SS clock can show.
const TICK_MS = 1000;

/** The 40-minute round. Out of the panel so the rail can show the same clock. */
export function useDesignRound() {
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

  return {
    running,
    elapsedMs,
    /** True once the clock has been started, even while paused. */
    started: elapsedMs > 0 || running,
    phase,
    index,
    phaseRemainingMs,
    overrun,
    remainingMs,
    overrunMs: elapsedMs - ROUND_MINUTES * 60_000,
    start,
    pause,
    reset,
  };
}

export type DesignRound = ReturnType<typeof useDesignRound>;

import { useEffect, useRef, useState } from "react";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up to `value` (ease-out) so a score lands as an event, not a static number.
 * Starts at 0 on mount and continues from the current number when `value` changes.
 */
export function useCountUp(value: number, durationMs = 650) {
  const [shown, setShown] = useState(() => (reduceMotion() ? value : 0));
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const from = shownRef.current;
    if (from === value || reduceMotion()) {
      setShown(value);
      return undefined;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      // rAF timestamps can precede `startedAt`; clamp so ease-out never undershoots below `from`.
      const progress = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return shown;
}

import { useEffect, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

/** Counts from 0 to `value` so a drill score lands as an event, not a static number. */
export function useCountUp(value: number, durationMs = 650) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (value <= 0 || reduceMotion) {
      setShown(value);
      return undefined;
    }
    let frame = 0;
    const startedAt = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
      setShown(Math.round(value * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reduceMotion]);

  return shown;
}

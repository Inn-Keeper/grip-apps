import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { DESIGN_PHASES, ROUND_MINUTES, ROUND_MS, formatClock, phaseAt, roundProgress } from "@grip/core/designTimer";
import { t } from "@grip/core/i18n";
import { colors } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { MiniButton } from "@/components/ui";

// One tick per second is all a MM:SS clock can show.
const TICK_MS = 1000;

/**
 * Countdown state shared by the toolbar bar and the zen overlay. Anchored to
 * wall-clock time so a backgrounded app resumes at the right point instead of
 * counting the ticks it missed.
 */
export function useDesignTimer() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const anchorRef = useRef<{ startedAt: number; before: number } | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const anchor = anchorRef.current;
      if (anchor) setElapsedMs(anchor.before + (Date.now() - anchor.startedAt));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      const anchor = anchorRef.current;
      if (anchor) setElapsedMs(anchor.before + (Date.now() - anchor.startedAt));
      anchorRef.current = null;
      setRunning(false);
      return;
    }
    anchorRef.current = { startedAt: Date.now(), before: elapsedMs };
    setRunning(true);
  };

  const reset = () => {
    anchorRef.current = null;
    setRunning(false);
    setElapsedMs(0);
  };

  const { phase, index, phaseRemainingMs, overrun } = phaseAt(elapsedMs);
  const { remainingMs } = roundProgress(elapsedMs);
  const started = elapsedMs > 0 || running;
  const clock = overrun ? formatClock(-(elapsedMs - ROUND_MS)) : formatClock(remainingMs);

  return { running, started, clock, phase, index, phaseRemainingMs, overrun, toggle, reset };
}

type Props = { timer: ReturnType<typeof useDesignTimer> };

export function DesignTimerBar({ timer }: Props) {
  const { running, started, clock, phase, index, phaseRemainingMs, overrun, toggle, reset } = timer;
  const clockColor = overrun
    ? colors.danger
    : started && phaseRemainingMs <= 60_000
      ? colors.warning
      : colors.textBright;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <TouchableOpacity onPress={toggle} hitSlop={6} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <BrandIcon name={running ? "close" : "spark"} color={running ? colors.textDim : colors.accentBright} size={14} />
        <Text style={{ fontSize: 16, fontWeight: "700", color: clockColor, fontVariant: ["tabular-nums"] }}>{clock}</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "700", color: overrun ? colors.dangerBright : colors.accentBright }}>
          {overrun ? t("timer.overtime") : started ? phase.label : t("timer.round", { minutes: ROUND_MINUTES })}
        </Text>
        {/* Phase strip: each segment proportional to its minutes. */}
        <View style={{ flexDirection: "row", gap: 2, height: 4 }}>
          {DESIGN_PHASES.map((p, i) => (
            <View
              key={p.id}
              style={{
                flex: p.minutes,
                borderRadius: 2,
                backgroundColor: i < index ? colors.accent : i === index && started ? colors.accentBright : colors.border,
                opacity: i < index ? 0.55 : 1,
              }}
            />
          ))}
        </View>
      </View>

      {started && <MiniButton label={t("timer.reset")} color={colors.textDim} onPress={reset} />}
    </View>
  );
}

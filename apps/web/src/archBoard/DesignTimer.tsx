import { DESIGN_PHASES, ROUND_MINUTES, formatClock } from "@grip/core/designTimer";
import { t } from "@grip/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./DesignTimer.module.css";
import type { DesignRound } from "./useDesignRound";

const sectionLabels = (ids: string[]) =>
  ids.map((id) => TALK_TRACK_SECTIONS.find((s) => s.id === id)?.label ?? id).join(" · ");

/** The round's own panel. State lives in useDesignRound, shared with the rail. */
export function DesignTimer({ round }: { round: DesignRound }) {
  const { running, elapsedMs, started, phase, index, phaseRemainingMs, overrun, remainingMs, start, pause, reset } = round;

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
            // Outline, never filled: the round is an optional aid beside the
            // work, and a second filled button reads as a second main action
            // on a screen that allows one (rules 1 and 2).
            padding: "8px 14px", background: "transparent",
            border: `1px solid ${running ? colors.borderSoft : colors.accent}`, borderRadius: 8,
            color: running ? colors.textDim : colors.accentBright, fontSize: font.size.small, fontWeight: 700, cursor: "pointer",
          }}
        >
          <BrandIcon name={running ? "close" : "spark"} color={running ? colors.textDim : colors.accentBright} size={13} />
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

import { useEffect, useRef, type CSSProperties } from "react";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { formatClock } from "@grip/core/designTimer";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./ArchBoard.module.css";
import type { DesignRound } from "./useDesignRound";
import { WORKFLOW_STEPS, stepState } from "./workflowState.js";

export type RailAction = {
  label: string;
  icon: string;
  onClick: () => void;
  disabled: boolean;
  /** False once the action has been taken, which stops the shine. */
  highlight: boolean;
};

/**
 * The whole journey, always on screen. Finished steps stay visible and marked
 * done: a rail that shows only the current step is as opaque as no rail, since
 * you cannot reason about where you are without seeing where you have been.
 */
export function WorkflowSteps({
  activeStep,
  action,
  round,
}: {
  activeStep: number;
  /**
   * The step's main action, carried only while the Next Up card is off screen.
   * Knowing which step you are on is useless if the button for it scrolled
   * away, but showing it in both places would put one action twice on a screen
   * that allows it once (rules 1 and 6).
   */
  action: RailAction | null;
  /**
   * The running round, passed only while its panel is off screen. The rail is
   * where the journey lives, so the clock joins it rather than starting a
   * second progress display of its own.
   */
  round: DesignRound | null;
}) {
  const rail = useRef<HTMLDivElement>(null);

  // Publish the real height: the pills wrap on narrow screens, so a fixed value
  // would leave scrolled-to content either clipped or floating.
  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const publish = () => document.documentElement.style.setProperty("--rail-h", `${node.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--rail-h");
    };
  }, []);

  return (
    <div
      ref={rail}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        // Sticky so evaluating, which scrolls the results into view, cannot take
        // the sense of progress off screen with it. --rail-h in index.html keeps
        // scroll targets clear of it, so it hides nothing (rule 7).
        position: "sticky",
        top: "var(--header-h, 0px)",
        // Above .zoomControls (z-index 2): that control belongs to the canvas,
        // and once the canvas has scrolled past there is nothing to zoom.
        zIndex: 3,
        padding: "6px 0 10px",
        background: colors.bg,
      }}
    >
    <ol
      aria-label={t("board.railLabel")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        // Shrinks rather than claiming the row, so the action stays on the same
        // line as the step it belongs to instead of wrapping under it.
        flex: "1 1 auto",
        minWidth: 0,
        margin: 0,
        padding: 0,
        listStyle: "none",
      }}
    >
      {WORKFLOW_STEPS.map(({ step, labelKey }) => {
        const state = stepState(step, activeStep);
        const done = state === "done";
        const current = state === "current";
        return (
          <li
            key={step}
            aria-current={current ? "step" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minHeight: 24,
              padding: "3px 10px 3px 6px",
              borderRadius: 999,
              // Only the current step gets a light edge (rule 22).
              border: `1px solid ${current ? colors.accent : "transparent"}`,
              background: current ? `${colors.accent}1A` : "transparent",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "grid",
                placeItems: "center",
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: done ? colors.successBright : current ? colors.accent : "transparent",
                border: done || current ? "none" : `1px solid ${colors.borderSoft}`,
                color: done || current ? colors.onAccent : colors.textFaint,
                fontSize: font.size.caption,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {done ? "✓" : step}
            </span>
            <span
              style={{
                fontSize: font.size.label,
                fontWeight: current ? 800 : 600,
                color: current ? colors.textBright : done ? colors.textDim : colors.textFaint,
              }}
            >
              {t(labelKey as Parameters<typeof t>[0])}
            </span>
          </li>
        );
      })}
    </ol>
      {round && (
        <span
          aria-label={round.overrun ? t("timer.overtime") : round.phase.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: "0 0 auto",
            padding: "3px 10px",
            borderRadius: 999,
            border: `1px solid ${round.overrun ? `${colors.danger}55` : colors.borderSoft}`,
            background: colors.surface,
            fontSize: font.size.label,
          }}
        >
          <span style={{ fontWeight: 800, color: round.overrun ? colors.dangerBright : colors.textBright, fontVariantNumeric: "tabular-nums" }}>
            {round.overrun ? formatClock(-round.overrunMs) : formatClock(round.remainingMs)}
          </span>
          <span style={{ color: colors.textFaint }}>
            {round.overrun ? t("timer.overtime") : round.phase.label}
          </span>
        </span>
      )}
      {action && (
        <button
          type="button"
          className={`${styles.railAction}${action.highlight ? ` ${styles.railActionShine}` : ""}`}
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: "0 0 auto",
            padding: "6px 14px",
            background: colors.accent,
            border: "none",
            borderRadius: 8,
            color: colors.onAccent,
            fontSize: font.size.small,
            fontWeight: 800,
            cursor: action.disabled ? "default" : "pointer",
            opacity: action.disabled ? 0.6 : 1,
            ["--twinkle-color" as string]: colors.accentBright,
          } as CSSProperties}
        >
          <BrandIcon name={action.icon} color={colors.onAccent} size={13} />
          {action.label}
        </button>
      )}
    </div>
  );
}

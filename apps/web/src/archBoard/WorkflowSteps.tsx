import { useEffect, useRef } from "react";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { WORKFLOW_STEPS, stepState } from "./workflowState.js";

/**
 * The whole journey, always on screen. Finished steps stay visible and marked
 * done: a rail that shows only the current step is as opaque as no rail, since
 * you cannot reason about where you are without seeing where you have been.
 */
export function WorkflowSteps({ activeStep }: { activeStep: number }) {
  const rail = useRef<HTMLOListElement>(null);

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
    <ol
      ref={rail}
      aria-label={t("board.railLabel")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        margin: 0,
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
  );
}

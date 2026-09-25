import type React from "react";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./ArchBoard.module.css";
import type { RailAction } from "./WorkflowSteps";

// The step's main action when it lives in the right rail, with the twinkle halo.
export function RailActionButton({ action }: { action: RailAction }) {
  return (
    <button
      type="button"
      className={`${styles.railAction} ${styles.railActionShine}`}
      onClick={action.onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "11px 14px",
        background: colors.accent, border: "none", borderRadius: 8, color: colors.onAccent,
        fontSize: font.size.body, fontWeight: 800, cursor: "pointer",
        ["--twinkle-color" as string]: colors.accentBright,
      } as React.CSSProperties}
    >
      <BrandIcon name={action.icon} color={colors.onAccent} size={14} />
      {action.label}
    </button>
  );
}

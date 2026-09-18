import React from "react";
import { colors, space, font } from "@grip/core/tokens";
import { FormInput, FormTextarea } from "./FormInput";
import { MiniButton } from "./MiniButton";

// Field styles live with FormInput; these names stay for existing imports.
export { fieldStyle as inputStyle, textareaFieldStyle as textareaStyle } from "./fieldStyles";

export function miniBtn(color: string): React.CSSProperties {
  return {
    padding: `${space.xs}px ${space.sm! + 2}px`,
    background: "transparent",
    border: `1px solid ${color}50`,
    borderRadius: space.md,
    color,
    fontSize: font.size!.label,
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

// New component exports
export { FormInput, FormTextarea, MiniButton };

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: space.xs + 2, minWidth: 0 }}>
      <span
        style={{
          fontSize: font.size.label,
          fontWeight: "700",
          color: colors.textDim,
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

import React from "react";
import { colors, space, font } from "@grip/core/tokens";
import { FormInput, FormTextarea } from "./FormInput";
import { MiniButton } from "./MiniButton";

// Legacy exports for backward compatibility (deprecated — use FormInput/MiniButton directly)
export const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: `${space.xs}px ${space.sm! + 2}px`,
  background: colors.bgDeep,
  border: `1px solid ${colors.border}`,
  borderRadius: space.md,
  color: colors.text,
  fontSize: font.size!.body,
  outline: "none",
  fontFamily: "inherit",
};

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 56,
  resize: "vertical",
  lineHeight: 1.5,
};

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
    <label style={{ display: "flex", flexDirection: "column", gap: space.xs, minWidth: 0 }}>
      <span
        style={{
          fontSize: font.size!.label,
          fontWeight: "600",
          color: colors.textFaint,
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

import type { CSSProperties } from "react";
import { colors, font, radius, space } from "../lib/tokens";

// Shared wizard look: calm surfaces, teal only on the selected state and the primary action.
export const primaryBtn = (enabled = true): CSSProperties => ({
  minHeight: 44,
  padding: `${space.sm + 2}px ${space.lg}px`,
  borderRadius: radius.sm,
  border: "none",
  background: colors.accent,
  color: colors.onAccent,
  fontWeight: 700,
  fontSize: font.size.body,
  cursor: enabled ? "pointer" : "not-allowed",
  opacity: enabled ? 1 : 0.5,
});

export const ghostBtn: CSSProperties = {
  minHeight: 44,
  padding: `${space.sm + 2}px ${space.lg}px`,
  borderRadius: radius.sm,
  border: "1px solid transparent",
  background: "transparent",
  color: colors.textDim,
  fontSize: font.size.body,
  cursor: "pointer",
};

export const choiceBtn = (selected: boolean): CSSProperties => ({
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space.md,
  padding: `${space.sm + 2}px ${space.lg}px`,
  borderRadius: radius.sm,
  border: `1px solid ${selected ? colors.accent : colors.border}`,
  background: selected ? colors.accentSoft : colors.surface,
  color: colors.text,
  fontSize: font.size.body,
  textAlign: "left",
  cursor: "pointer",
});

export const dimText: CSSProperties = { margin: 0, color: colors.textDim, fontSize: font.size.small };

export const stackCol = (gap = space.lg): CSSProperties => ({ display: "flex", flexDirection: "column", gap });

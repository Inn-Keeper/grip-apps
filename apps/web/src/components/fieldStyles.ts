import type { CSSProperties } from "react";
import { colors, space, font, radius } from "@grip/core/tokens";

// The field standard (SCREEN-GUIDELINES.md, Forms): 40px tall, 8px corners like panels,
// dark inset background. Focus rings come from the global :focus-visible rule in index.html.
export const fieldStyle: CSSProperties = {
  width: "100%",
  minHeight: 40,
  boxSizing: "border-box",
  padding: `${space.sm + 2}px ${space.md}px`,
  background: colors.bgDeep,
  border: `1px solid ${colors.borderSoft}`,
  borderRadius: radius.sm,
  color: colors.text,
  fontSize: font.size.body,
  lineHeight: 1.4,
  fontFamily: "inherit",
};

export const textareaFieldStyle: CSSProperties = {
  ...fieldStyle,
  minHeight: 96,
  resize: "vertical",
  lineHeight: 1.5,
};

// Small outline button beside cards and rows.
export function miniBtn(color: string): CSSProperties {
  return {
    padding: `${space.xs}px ${space.sm + 2}px`,
    background: "transparent",
    border: `1px solid ${color}50`,
    borderRadius: space.md,
    color,
    fontSize: font.size.label,
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

// A focused view (a quiz, a form, a detail) in the main column: capped for readable
// lines and centered, so wide screens don't leave all the spare room on one side.
export const workspaceFocusStyle: CSSProperties = { width: "min(100%, 860px)", marginInline: "auto", paddingBottom: 48 };

// Visually hidden, still read by screen readers.
export const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

// Quiet body text inside cards (descriptions, notes, how-tos): textDim at 80%, ~4.6:1 on
// surface, so it recedes behind titles and data yet stays readable. textFaint would fail AA.
export const quietText = `${colors.textDim}CC`;

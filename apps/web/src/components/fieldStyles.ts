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

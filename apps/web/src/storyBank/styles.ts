import { fieldStyle as inputStyle } from "../components/fieldStyles";
import type React from "react";

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 64,
  resize: "vertical",
  lineHeight: 1.5,
};

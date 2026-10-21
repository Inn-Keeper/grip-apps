// Style shortcuts for the web board's style panel (sizing, resizing and arrowheads live in core).
import { TEXT_SIZES } from "@grip/core/arch";

/** Shortcuts shown in the panel, in `aria-keyshortcuts` form. */
export const STYLE_SHORTCUTS = {
  bigger: "Control+Shift+Period Meta+Shift+Period",
  smaller: "Control+Shift+Comma Meta+Shift+Comma",
  bold: "Control+B Meta+B",
  left: "Alt+Shift+L",
  center: "Alt+Shift+C",
  right: "Alt+Shift+R",
};

// Alignment sits on Alt+Shift: Cmd/Ctrl+Shift+R is the browser's hard reload.
const ALIGN_CODES = { KeyL: "left", KeyC: "center", KeyR: "right" };

/**
 * The style patch a key press asks for, or null when it is not a style shortcut.
 * Codes, not keys: Alt and Shift change `key` per layout (Alt+L is "¬" on a Mac).
 * @param {{ code: string, metaKey: boolean, ctrlKey: boolean, shiftKey: boolean, altKey: boolean }} event
 * @param {ReturnType<typeof import("@grip/core/arch").styleOf>} style
 * @returns {import("@grip/core/arch").FreeStyle | null}
 */
export function styleShortcut(event, style) {
  const mod = event.metaKey || event.ctrlKey;
  const step = TEXT_SIZES.indexOf(style.size);
  if (mod && event.shiftKey && event.code === "Period") return step < TEXT_SIZES.length - 1 ? { size: TEXT_SIZES[step + 1] } : {};
  if (mod && event.shiftKey && event.code === "Comma") return step > 0 ? { size: TEXT_SIZES[step - 1] } : {};
  if (mod && !event.shiftKey && !event.altKey && event.code === "KeyB") return { bold: !style.bold };
  if (event.altKey && event.shiftKey && !mod && ALIGN_CODES[event.code]) return { align: ALIGN_CODES[event.code] };
  return null;
}

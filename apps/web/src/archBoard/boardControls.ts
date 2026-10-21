import type React from "react";

// Shared, non-component pieces of the canvas controls (kept apart for React fast refresh).

export type Tool = "text" | "arrow" | "line";
export type Shape = "rect" | "diamond" | "ellipse" | "note";

// Shortcut letters follow Excalidraw. Shapes appear at once; the draw tools wait for the canvas.
export const SHAPE_KEYS: Record<string, Shape> = { r: "rect", d: "diamond", o: "ellipse", n: "note" };
export const TOOL_KEYS: Record<string, Tool> = { a: "arrow", l: "line", t: "text" };

// 24px: the smallest tap target (rule 45), and small enough not to crowd the label.
export const cornerButton: React.CSSProperties = {
  position: "absolute", right: -12, width: 24, height: 24, borderRadius: "50%", border: "none",
  cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
};

export type Rect = { x: number; y: number; w: number; h: number };

// Every node has a connect circle in the middle of each side.
export const CONNECT_SIDES = ["top", "right", "bottom", "left"] as const;
export type ConnectSide = (typeof CONNECT_SIDES)[number];

// Corners only: the middle of every side belongs to a connect circle.
export const RESIZE_HANDLES = ["ne", "nw", "se", "sw"] as const;

const RESIZE_KEYS: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };

/** Alt + arrow keys grow or shrink from the bottom-right corner, by 10 or by 1 with Shift; null otherwise. */
export function resizeFromKey(event: React.KeyboardEvent): [number, number] | null {
  const grow = event.altKey ? RESIZE_KEYS[event.key] : undefined;
  if (!grow) return null;
  const step = event.shiftKey ? 1 : 10;
  return [grow[0] * step, grow[1] * step];
}

/** Focuses an in-place editor with the caret at the end, so editing continues the text instead of replacing it. */
export function focusAtEnd(el: HTMLElement) {
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
}

/** Arrow keys move a node by 10, or by 1 with Shift; null for any other key. */
export function nudgeFromKey(event: React.KeyboardEvent): [number, number] | null {
  const step = event.shiftKey ? 1 : 10;
  const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  return moves[event.key] ?? null;
}

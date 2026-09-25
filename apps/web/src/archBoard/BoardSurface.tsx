import type React from "react";
import type { ReactNode, RefObject } from "react";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { WORLD } from "./constants";
import styles from "./ArchBoard.module.css";

// Touch-first devices get tap/pinch wording instead of Shift-drag and Ctrl/⌘ + scroll.
const coarsePointer = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

type Props = {
  canvasRef: RefObject<HTMLDivElement | null>;
  view: { x: number; y: number; scale: number };
  fullscreen: boolean;
  empty: boolean;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
  // Every click on the canvas; onSurface is true for bare board (not a node or arrow).
  onCanvasClick: (onSurface: boolean) => void;
  controls: ReactNode;
  children: ReactNode;
};

// The pannable, zoomable board: a dot grid that moves with the world layer inside it.
export function BoardSurface({ canvasRef, view, fullscreen, empty, onPointerMove, onPointerUp, onPointerCancel, onCanvasClick, controls, children }: Props) {
  const dot = Math.max(0.6, view.scale);
  return (
    <div
      ref={canvasRef}
      className={styles.canvas}
      data-board-surface="true"
      tabIndex={0}
      aria-label={t("board.canvasLabel")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={(e) => onCanvasClick((e.target as HTMLElement).dataset.boardSurface === "true")}
      style={{
        position: "relative", minWidth: 0, height: fullscreen ? "100%" : "calc(100svh - 430px)",
        // Never taller than the screen minus a strip of page: the canvas eats swipes
        // (touch-action: none), so there must always be room outside it to scroll.
        minHeight: fullscreen ? 0 : "clamp(220px, calc(100svh - 160px), 420px)",
        background: colors.bgDeep,
        backgroundImage: `radial-gradient(${colors.borderSoft} ${dot}px, transparent ${dot}px)`,
        backgroundSize: `${22 * view.scale}px ${22 * view.scale}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
        border: `1px solid ${colors.borderSoft}`, borderRadius: 14, overflow: "hidden", touchAction: "none",
      }}
    >
      {empty && (
        <div
          style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.textFaint, fontSize: font.size.body, pointerEvents: "none", padding: "0 24px", textAlign: "center",
          }}
        >
          {t(coarsePointer ? "board.emptyCanvasHintTouch" : "board.emptyCanvasHint")}
        </div>
      )}
      <div
        data-board-surface="true"
        style={{
          position: "absolute", left: 0, top: 0, width: WORLD.width, height: WORLD.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
      {controls}
    </div>
  );
}

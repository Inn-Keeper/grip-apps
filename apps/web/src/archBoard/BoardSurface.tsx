import type React from "react";
import type { ReactNode, RefObject } from "react";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { WORLD } from "./constants";
import styles from "./ArchBoard.module.css";

// Touch-first devices get pinch wording instead of Ctrl/⌘ + scroll.
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
  onCanvasClick: (onSurface: boolean, e: React.MouseEvent) => void;
  onCanvasDoubleClick: (onSurface: boolean, e: React.MouseEvent) => void;
  // The Text tool is armed: the board shows a text cursor.
  textTool: boolean;
  controls: ReactNode;
  children: ReactNode;
};

// The pannable, zoomable board: a plain sunken plane with the world layer inside it.
export function BoardSurface({ canvasRef, view, fullscreen, empty, onPointerMove, onPointerUp, onPointerCancel, onCanvasClick, onCanvasDoubleClick, textTool, controls, children }: Props) {
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
      data-tool={textTool ? "text" : undefined}
      onClick={(e) => onCanvasClick((e.target as HTMLElement).dataset.boardSurface === "true", e)}
      onDoubleClick={(e) => onCanvasDoubleClick((e.target as HTMLElement).dataset.boardSurface === "true", e)}
      style={{
        position: "relative",
        minWidth: 0,
        // Fills the screen minus a strip of page: the canvas eats swipes
        // (touch-action: none), so there must always be room outside it to scroll.
        height: fullscreen ? "100%" : "calc(100svh - 160px)",
        minHeight: fullscreen ? 0 : 220,
        background: colors.bgDeep,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 14,
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      {empty && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textFaint,
            fontSize: font.size.body,
            pointerEvents: "none",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          {t(coarsePointer ? "board.emptyCanvasHintTouch" : "board.emptyCanvasHint")}
        </div>
      )}
      <div
        data-board-surface="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WORLD.width,
          height: WORLD.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
      {controls}
    </div>
  );
}

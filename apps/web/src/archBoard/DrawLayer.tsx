import type React from "react";
import { useRef } from "react";
import { t } from "@grip/core/i18n";
import styles from "./ArchBoard.module.css";

type Points = { x: number; y: number; x2: number; y2: number };

type Props = {
  toBoard: (e: React.PointerEvent) => { x: number; y: number } | null;
  onDraft: (points: Points | null) => void;
  onDone: (points: Points) => void;
};

// Shorter than this is a click, not an arrow.
const MIN_LENGTH = 8;

// Covers the canvas while the Arrow or Line tool is on: press, drag, release draws one.
// It sits above the board so the press never starts a pan.
export function DrawLayer({ toBoard, onDraft, onDone }: Props) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const pointsAt = (e: React.PointerEvent) => {
    const point = toBoard(e);
    const start = startRef.current;
    return point && start ? { x: start.x, y: start.y, x2: point.x, y2: point.y } : null;
  };

  return (
    <div
      className={styles.drawLayer}
      aria-hidden="true"
      title={t("board.drawHint")}
      onPointerDown={(e) => {
        startRef.current = toBoard(e);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => { if (startRef.current) onDraft(pointsAt(e)); }}
      onPointerUp={(e) => {
        const points = pointsAt(e);
        startRef.current = null;
        onDraft(null);
        if (points && Math.hypot(points.x2 - points.x, points.y2 - points.y) >= MIN_LENGTH) onDone(points);
      }}
      onPointerCancel={() => { startRef.current = null; onDraft(null); }}
    />
  );
}

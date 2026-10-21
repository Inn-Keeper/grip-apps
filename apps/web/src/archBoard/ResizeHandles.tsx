import type React from "react";
import { useRef } from "react";
import styles from "./ArchBoard.module.css";
import { RESIZE_HANDLES, type Rect } from "./boardControls";
import { resizeRect } from "@grip/core/arch";

type Props = {
  rect: Rect;
  min: { w: number; h: number };
  toBoard: (e: React.PointerEvent) => { x: number; y: number } | null;
  // Live size while dragging (null when done), so the node redraws without an undo step per frame.
  onDraft: (rect: Rect | null) => void;
  onResize: (rect: Rect) => void;
};

// Drag handles on a selected node; the drop is one committed resize.
export function ResizeHandles({ rect, min, toBoard, onDraft, onResize }: Props) {
  const drag = useRef<{ dir: string; start: { x: number; y: number }; rect: Rect; last: Rect | null } | null>(null);

  const start = (dir: string) => (ev: React.PointerEvent) => {
    ev.stopPropagation();
    const point = toBoard(ev);
    if (!point) return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drag.current = { dir, start: point, rect, last: null };
  };
  const move = (ev: React.PointerEvent) => {
    const current = drag.current;
    const point = current && toBoard(ev);
    if (!current || !point) return;
    current.last = resizeRect(current.rect, current.dir, point.x - current.start.x, point.y - current.start.y, min);
    onDraft(current.last);
  };
  const end = () => {
    if (drag.current?.last) onResize(drag.current.last);
    drag.current = null;
    onDraft(null);
  };

  return (
    <>
      {RESIZE_HANDLES.map((dir) => (
        <span
          key={dir}
          className={styles.resizeHandle}
          data-dir={dir}
          aria-hidden="true"
          onPointerDown={start(dir)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      ))}
    </>
  );
}

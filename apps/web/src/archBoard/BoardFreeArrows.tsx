import type React from "react";
import { useState } from "react";
import { styleOf } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import styles from "./ArchBoard.module.css";
import { headPoints } from "@grip/core/edgeGeometry";
import { nudgeFromKey } from "./boardControls";
import type { BoardNode } from "./types";

type Points = { x: number; y: number; x2: number; y2: number };
type Drag = { id: string; part: "start" | "end" | "line"; from: { x: number; y: number }; points: Points };

type Props = {
  arrows: BoardNode[];
  selectedId: string | null;
  // The arrow being drawn with the Arrow or Line tool, before it is committed.
  draft: (Points & { heads: string }) | null;
  size: { width: number; height: number };
  toBoard: (e: React.PointerEvent) => { x: number; y: number } | null;
  onSelect: (id: string) => void;
  onMove: (id: string, points: Points) => void;
  onRemove: (id: string) => void;
};

const pointsOf = (n: BoardNode): Points => ({ x: n.x, y: n.y, x2: n.x2 ?? n.x, y2: n.y2 ?? n.y });

function Line({ p, color, dashed, heads }: { p: Points; color: string | undefined; dashed: boolean; heads: string }) {
  const start = { x: p.x, y: p.y };
  const end = { x: p.x2, y: p.y2 };
  return (
    <>
      <line x1={p.x} y1={p.y} x2={p.x2} y2={p.y2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={dashed ? "7 5" : undefined} />
      {heads !== "none" && <polygon points={headPoints(start, end)} fill={color} />}
      {heads === "both" && <polygon points={headPoints(end, start)} fill={color} />}
    </>
  );
}

// Free arrows and lines: never graded, ends stay where they are dropped.
// Drag the line to move it, drag an end to reshape it; arrows nudge, Delete removes.
export function BoardFreeArrows({ arrows, selectedId, draft, size, toBoard, onSelect, onMove, onRemove }: Props) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [live, setLive] = useState<Points | null>(null);

  const start = (n: BoardNode, part: Drag["part"]) => (ev: React.PointerEvent<SVGElement>) => {
    ev.stopPropagation();
    const from = toBoard(ev);
    if (!from) return;
    (ev.currentTarget.closest("g") as SVGGElement | null)?.focus();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    setDrag({ id: n.id, part, from, points: pointsOf(n) });
  };
  const move = (ev: React.PointerEvent) => {
    const point = drag && toBoard(ev);
    if (!drag || !point) return;
    const dx = point.x - drag.from.x;
    const dy = point.y - drag.from.y;
    const p = drag.points;
    if (drag.part === "start") setLive({ ...p, x: p.x + dx, y: p.y + dy });
    else if (drag.part === "end") setLive({ ...p, x2: p.x2 + dx, y2: p.y2 + dy });
    else setLive({ x: p.x + dx, y: p.y + dy, x2: p.x2 + dx, y2: p.y2 + dy });
  };
  const end = () => {
    if (drag && live) onMove(drag.id, live);
    setDrag(null);
    setLive(null);
  };
  const handlers = { onPointerMove: move, onPointerUp: end, onPointerCancel: end };

  return (
    <svg width={size.width} height={size.height} style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        overflow: "visible"
      }}>
      {arrows.map((n) => {
        const style = styleOf(n);
        const p = drag?.id === n.id && live ? live : pointsOf(n);
        const selected = selectedId === n.id;
        const kind = style.heads === "none" ? ("board.lineLabel" as const) : ("board.arrowLabel" as const);
        return (
          <g
            key={n.id}
            className={styles.freeArrow}
            tabIndex={0}
            role="group"
            aria-label={t(kind)}
            onFocus={() => onSelect(n.id)}
            onKeyDown={(event) => {
              const nudge = nudgeFromKey(event);
              if (nudge) {
                event.preventDefault();
                onMove(n.id, { x: p.x + nudge[0], y: p.y + nudge[1], x2: p.x2 + nudge[0], y2: p.y2 + nudge[1] });
              }
              if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onRemove(n.id); }
            }}
          >
            {selected && <line x1={p.x} y1={p.y} x2={p.x2} y2={p.y2} stroke={colors.accent} strokeOpacity={0.35} strokeWidth={8} strokeLinecap="round" />}
            <Line p={p} color={colors[style.color]} dashed={style.dashed} heads={style.heads} />
            {/* Wide invisible stroke: a 2px line is too thin to grab. */}
            <line x1={p.x} y1={p.y} x2={p.x2} y2={p.y2} stroke="transparent" strokeWidth={14} style={{
                pointerEvents: "stroke",
                cursor: "move"
              }} onPointerDown={start(n, "line")} {...handlers} />
            {selected && (["start", "end"] as const).map((part) => (
              <circle
                key={part}
                cx={part === "start" ? p.x : p.x2}
                cy={part === "start" ? p.y : p.y2}
                r={6}
                fill={colors.surface}
                stroke={colors.accent}
                strokeWidth={2}
                style={{
                  pointerEvents: "all",
                  cursor: "crosshair"
                }}
                onPointerDown={start(n, part)}
                {...handlers}
              />
            ))}
          </g>
        );
      })}
      {draft && <Line p={draft} color={colors.textDim} dashed={false} heads={draft.heads} />}
    </svg>
  );
}

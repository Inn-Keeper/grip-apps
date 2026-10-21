import type React from "react";
import { useState } from "react";
import { FILL_ALPHA, MIN_CARD, STATEFUL_TYPES, TEXT_FONT_TOKEN, TYPE_COLORS, nodeLabel, nodeSize, resizeRect, styleOf } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { NODE_H, NODE_W } from "./constants";
import styles from "./ArchBoard.module.css";
import { CONNECT_SIDES, cornerButton, nudgeFromKey, resizeFromKey, type Rect } from "./boardControls";
import { ResizeHandles } from "./ResizeHandles";
import { ConnectHandle, RemoveButton, type ConnectHandlers } from "./nodeControls";
import type { BoardNode } from "./types";

type PointerHandler = (e: React.PointerEvent) => void;

type Props = {
  node: BoardNode;
  selected: boolean;
  isSource: boolean;
  inspecting: boolean;
  drag: { down: PointerHandler; move: PointerHandler; up: PointerHandler };
  // Dragging from a side handle draws an arrow.
  connect: ConnectHandlers;
  onActivate: () => void;
  onNudge: (dx: number, dy: number) => void;
  onRemove: () => void;
  onToggleInspect: () => void;
  toBoard: (e: React.PointerEvent) => { x: number; y: number } | null;
  onResize: (rect: Rect) => void;
  // Focus picks the node, which shows its resize handles.
  onSelect: () => void;
};

// One built-in component on the canvas: drag to move, drag a handle or press Enter to connect, arrows to nudge,
// and drag a corner handle or Alt+arrows to resize. The border keeps the type colour (node identity);
// fill and label follow the style panel. Neither size nor style changes the grade.
// Free shapes are BoardShape, free text is BoardTextNote.
export function BoardNodeCard({ node: n, selected, isSource, inspecting, drag, connect, onActivate, onNudge, onRemove, onToggleInspect, toBoard, onResize, onSelect }: Props) {
  const name = nodeLabel(n);
  const color = TYPE_COLORS[n.type] ?? colors.textDim;
  const size = nodeSize(n, { width: NODE_W, height: NODE_H });
  const [draft, setDraft] = useState<Rect | null>(null);
  const rect = draft ?? { x: n.x, y: n.y, w: size.width, h: size.height };
  const handle = { size: { w: rect.w, h: rect.h }, color, name, isSource, connect, onActivate };
  const style = styleOf(n);

  return (
    <div
      className={styles.node}
      onPointerDown={drag.down}
      onPointerMove={drag.move}
      onPointerUp={drag.up}
      tabIndex={0}
      role="group"
      aria-label={t("board.nodeLabel", { name })}
      aria-keyshortcuts="Alt+ArrowRight Alt+ArrowLeft Alt+ArrowUp Alt+ArrowDown"
      onFocus={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter") { event.preventDefault(); onActivate(); }
        const grow = resizeFromKey(event);
        if (grow) { event.preventDefault(); onResize(resizeRect(rect, "se", ...grow, MIN_CARD)); return; }
        const nudge = nudgeFromKey(event);
        if (nudge) { event.preventDefault(); onNudge(...nudge); }
        if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onRemove(); }
      }}
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        boxSizing: "border-box",
        background: style.fill === "none" ? colors.surface : `${colors[style.fill]}${FILL_ALPHA}`,
        border: `2px solid ${isSource ? colors.textBright : `${color}60`}`,
        borderRadius: 10,
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 10px",
        boxShadow: isSource ? `0 0 0 3px ${color}30` : "none",
      }}
    >
      <span style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          flex: 1,
          minWidth: 0,
          textAlign: style.align
        }}>
        <span style={{
            fontSize: font.size[TEXT_FONT_TOKEN.card[style.size] as keyof typeof font.size],
            fontWeight: style.bold ? 700 : 600,
            color: colors[style.color],
            lineHeight: 1.3,
            overflowWrap: "anywhere"
          }}>{name}</span>
        {(n.partitionKey?.trim() || n.replicas) && (
          <span style={{
              fontSize: font.size.caption,
              color: colors.textFaint,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
            {[n.partitionKey?.trim(), n.replicas ? `×${n.replicas}` : null].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>
      {STATEFUL_TYPES.includes(n.type) && (
        <button
          onPointerDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => { ev.stopPropagation(); onToggleInspect(); }}
          title={t("node.inspect")}
          style={{
            ...cornerButton,
            bottom: -12,
            // Selected, the corner is a resize handle: step inside it.
            right: selected ? 10 : -12,
            background: inspecting ? colors.accent : colors.borderSoft
          }}
        >
          <BrandIcon name="maintenance" color={inspecting ? colors.onAccent : colors.textDim} size={10} />
        </button>
      )}
      {/* Selected, the style panel's trash bin takes over, and the corner is a resize handle. */}
      {!selected && <RemoveButton onRemove={onRemove} />}
      {CONNECT_SIDES.map((side) => <ConnectHandle key={side} side={side} {...handle} />)}
      {selected && <ResizeHandles rect={rect} min={MIN_CARD} toBoard={toBoard} onDraft={setDraft} onResize={onResize} />}
    </div>
  );
}

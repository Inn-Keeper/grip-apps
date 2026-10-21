import type React from "react";
import { useEffect, useRef, useState } from "react";
import { FILL_ALPHA, MIN_SHAPE, TEXT_FONT_TOKEN, nodeLabel, nodeSize, resizeRect, styleOf } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { NODE_H, NODE_W } from "./constants";
import styles from "./ArchBoard.module.css";
import { ResizeHandles } from "./ResizeHandles";
import { CONNECT_SIDES, focusAtEnd, nudgeFromKey, resizeFromKey, type Rect } from "./boardControls";
import { ConnectHandle, RemoveButton, type ConnectHandlers } from "./nodeControls";
import type { BoardNode } from "./types";

type PointerHandler = (e: React.PointerEvent) => void;

type Props = {
  node: BoardNode;
  selected: boolean;
  isSource: boolean;
  drag: { down: PointerHandler; move: PointerHandler; up: PointerHandler };
  connect: ConnectHandlers;
  toBoard: (e: React.PointerEvent) => { x: number; y: number } | null;
  onActivate: () => void;
  onNudge: (dx: number, dy: number) => void;
  onRemove: () => void;
  onLabel: (label: string) => void;
  onResize: (rect: Rect) => void;
  onSelect: () => void;
};


// The outline behind the label, drawn in SVG so diamonds and ellipses get a real border.
function Outline({ shape, w, h, fill, stroke }: { shape: string; w: number; h: number; fill: string | undefined; stroke: string | undefined }) {
  const common = { fill, stroke, strokeWidth: 2 };
  return (
    <svg width={w} height={h} style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none"
      }} aria-hidden="true">
      {shape === "ellipse" && <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 1} ry={h / 2 - 1} {...common} />}
      {shape === "diamond" && <polygon points={`${w / 2},1 ${w - 1},${h / 2} ${w / 2},${h - 1} 1,${h / 2}`} {...common} />}
      {(shape === "rect" || shape === "note") && <rect x={1} y={1} width={w - 2} height={h - 2} rx={shape === "note" ? 4 : 10} {...common} />}
    </svg>
  );
}

// A free shape: rectangle, diamond, ellipse or sticky note. Drag to move, drag a side
// circle to connect, double click or F2 to name it, and drag a handle or Alt+arrows to resize.
export function BoardShape({ node: n, selected, isSource, drag, connect, toBoard, onActivate, onNudge, onRemove, onLabel, onResize, onSelect }: Props) {
  const shape = n.shape ?? "rect";
  const note = shape === "note";
  const style = styleOf(n);
  const name = nodeLabel(n);
  const size = nodeSize(n, { width: NODE_W, height: NODE_H });
  const [editing, setEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = editorRef.current;
    if (editing && el) focusAtEnd(el);
  }, [editing]);
  const [draft, setDraft] = useState<Rect | null>(null);
  const rect = draft ?? { x: n.x, y: n.y, w: size.width, h: size.height };
  const stroke = isSource ? colors.textBright : selected ? colors.accent : `${colors.textDim}99`;
  const fill = style.fill === "none" ? colors.surface : `${colors[style.fill]}${FILL_ALPHA}`;
  const labelStyle: React.CSSProperties = {
    fontSize: font.size[TEXT_FONT_TOKEN.card[style.size] as keyof typeof font.size],
    fontWeight: style.bold ? 700 : 600,
    color: colors[style.color],
    textAlign: style.align,
    lineHeight: 1.3,
  };

  const finishEditing = (label: string) => {
    setEditing(false);
    if (label.trim() !== (n.label ?? "")) onLabel(label.trim());
  };

  return (
    <div
      className={styles.shape}
      onPointerDown={editing ? undefined : drag.down}
      onPointerMove={drag.move}
      onPointerUp={drag.up}
      tabIndex={0}
      role="group"
      aria-label={t(`board.shape.${shape}` as Parameters<typeof t>[0]) + (n.label ? `: ${n.label}` : "")}
      aria-keyshortcuts="F2 Alt+ArrowRight Alt+ArrowLeft Alt+ArrowUp Alt+ArrowDown"
      title={t("board.shapeHint")}
      onFocus={onSelect}
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (editing) return;
        if (event.key === "F2") { event.preventDefault(); setEditing(true); return; }
        if (event.key === "Enter") { event.preventDefault(); onActivate(); return; }
        const grow = resizeFromKey(event);
        if (grow) { event.preventDefault(); onResize(resizeRect(rect, "se", ...grow)); return; }
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
        cursor: editing ? "text" : "grab",
        touchAction: "none",
        userSelect: editing ? "text" : "none",
        display: "flex",
        alignItems: note ? "flex-start" : "center",
        // Diamonds and ellipses keep their text inside the curve.
        padding: note ? 12 : shape === "rect" ? "0 12px" : `0 ${Math.round(rect.w * 0.18)}px`,
        filter: note ? "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35))" : undefined,
      }}
    >
      <Outline shape={shape} w={rect.w} h={rect.h} fill={fill} stroke={stroke} />
      {editing ? (
        // Grows with its text rather than filling the shape, so typing starts where the
        // label will sit: centred by default, top left on a sticky note. No visible placeholder,
        // only the caret; the field's name is still announced.
        <div
          ref={editorRef}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={t(note ? "board.notePlaceholder" : "board.boxPlaceholder")}
          className={styles.textEditor}
          onPointerDown={(ev) => ev.stopPropagation()}
          onBlur={(ev) => finishEditing(ev.currentTarget.innerText)}
          onKeyDown={(ev) => {
            // Kept from the shape, whose Backspace deletes it and arrows nudge it.
            ev.stopPropagation();
            // A note takes new lines; a shape label finishes on Enter (Shift+Enter breaks the line).
            const done = ev.key === "Escape" || (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey || (!note && !ev.shiftKey)));
            if (done) { ev.preventDefault(); ev.currentTarget.blur(); }
          }}
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            maxHeight: "100%",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            cursor: "text",
            ...labelStyle,
          }}
        >
          {n.label ?? ""}
        </div>
      ) : (
        <span style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            maxHeight: "100%",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            ...labelStyle,
          }}>{n.label}</span>
      )}
      {/* Selected, the style panel's trash bin takes over, and the corner is a resize handle. */}
      {!selected && <RemoveButton onRemove={onRemove} />}
      {CONNECT_SIDES.map((side) => (
        <ConnectHandle key={side} side={side} size={{ w: rect.w, h: rect.h }} color={colors.textDim} name={name} isSource={isSource} connect={connect} onActivate={onActivate} />
      ))}
      {selected && !editing && <ResizeHandles rect={rect} min={MIN_SHAPE} toBoard={toBoard} onDraft={setDraft} onResize={onResize} />}
    </div>
  );
}

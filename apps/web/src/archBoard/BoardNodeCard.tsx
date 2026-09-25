import type React from "react";
import { STATEFUL_TYPES, TYPE_COLORS, meta } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";
import { NODE_H, NODE_W } from "./constants";
import styles from "./ArchBoard.module.css";
import type { BoardNode } from "./types";

type PointerHandler = (e: React.PointerEvent) => void;

type Props = {
  node: BoardNode;
  isSource: boolean;
  inspecting: boolean;
  drag: { down: PointerHandler; move: PointerHandler; up: PointerHandler };
  // Shift-drag from a side handle draws an arrow.
  connect: { start: PointerHandler; move: PointerHandler; finish: PointerHandler };
  onActivate: () => void;
  onNudge: (dx: number, dy: number) => void;
  onRemove: () => void;
  onToggleInspect: () => void;
};

const cornerButton: React.CSSProperties = {
  position: "absolute", right: -16, width: 32, height: 32, borderRadius: "50%", border: "none",
  cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
};

// One component on the canvas: drag to move, click or Enter to connect, arrows to nudge.
export function BoardNodeCard({ node: n, isSource, inspecting, drag, connect, onActivate, onNudge, onRemove, onToggleInspect }: Props) {
  const spec = meta(n.type);
  const color = TYPE_COLORS[n.type];
  const axisHandle = (side: "left" | "right") => (
    <button
      className={styles.handle}
      onPointerDown={(ev) => { ev.stopPropagation(); if (ev.shiftKey) connect.start(ev); }}
      onPointerMove={(ev) => { ev.stopPropagation(); connect.move(ev); }}
      onPointerUp={(ev) => { ev.stopPropagation(); connect.finish(ev); }}
      onClick={(ev) => { ev.stopPropagation(); onActivate(); }}
      aria-label={isSource ? t("board.cancelConnectFrom", { name: spec.label }) : t("board.connectFrom", { name: spec.label })}
      title={isSource ? t("board.cancelConnect") : t("board.connectTitle")}
      style={{
        position: "absolute", [side]: -16, top: NODE_H / 2 - 16, width: 32, height: 32, borderRadius: "50%",
        border: "none", background: "transparent", ["--node-color" as string]: color, cursor: "crosshair", padding: 0,
      }}
    />
  );

  return (
    <div
      className={styles.node}
      onPointerDown={drag.down}
      onPointerMove={drag.move}
      onPointerUp={drag.up}
      onClick={onActivate}
      tabIndex={0}
      role="group"
      aria-label={t("board.nodeLabel", { name: spec.label })}
      onKeyDown={(event) => {
        if (event.key === "Enter") { event.preventDefault(); onActivate(); }
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
          event.preventDefault();
          const step = event.shiftKey ? 1 : 10;
          onNudge(event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0, event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0);
        }
        if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onRemove(); }
      }}
      style={{
        position: "absolute", left: n.x, top: n.y, width: NODE_W, height: NODE_H, boxSizing: "border-box",
        background: colors.surface, border: `2px solid ${isSource ? colors.textBright : `${color}60`}`,
        borderRadius: 10, cursor: "grab", touchAction: "none", userSelect: "none",
        display: "flex", alignItems: "center", gap: 8, padding: "0 10px",
        boxShadow: isSource ? `0 0 0 3px ${color}30` : "none",
      }}
    >
      <BrandIcon name={nodeIconName(n.type)} color={color} size={18} />
      <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: font.size.label, fontWeight: 600, color: colors.text, lineHeight: 1.2 }}>{spec.label}</span>
        {(n.partitionKey?.trim() || n.replicas) && (
          <span style={{ fontSize: font.size.caption, color: colors.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {[n.partitionKey?.trim(), n.replicas ? `×${n.replicas}` : null].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>
      {STATEFUL_TYPES.includes(n.type) && (
        <button
          onPointerDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => { ev.stopPropagation(); onToggleInspect(); }}
          title={t("node.inspect")}
          style={{ ...cornerButton, bottom: -16, background: inspecting ? colors.accent : colors.borderSoft }}
        >
          <BrandIcon name="maintenance" color={inspecting ? colors.onAccent : colors.textDim} size={10} />
        </button>
      )}
      <button
        onPointerDown={(ev) => ev.stopPropagation()}
        onClick={(ev) => { ev.stopPropagation(); onRemove(); }}
        title={t("board.remove")}
        style={{ ...cornerButton, top: -16, background: colors.borderSoft }}
      >
        <BrandIcon name="close" color={colors.textDim} size={10} />
      </button>
      {axisHandle("left")}
      {axisHandle("right")}
    </div>
  );
}

import type React from "react";
import { t } from "@grip/core/i18n";
import { colors } from "../lib/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./ArchBoard.module.css";
import { cornerButton, type ConnectSide } from "./boardControls";

type PointerHandler = (e: React.PointerEvent) => void;
export type ConnectHandlers = { start: PointerHandler; move: PointerHandler; finish: PointerHandler };

type HandleProps = {
  side: ConnectSide;
  // The node's current size: each circle sits on the middle of its side.
  size: { w: number; h: number };
  color: string | undefined;
  name: string;
  isSource: boolean;
  connect: ConnectHandlers;
  onActivate: () => void;
};

// A side circle: drag from it to draw a graded arrow; Enter or Space connects from the keyboard.
// Only the left and right circles are tab stops: four per node would bury the board in Tab presses,
// and they all start the same connection.
export function ConnectHandle({ side, size, color, name, isSource, connect, onActivate }: HandleProps) {
  const vertical = side === "top" || side === "bottom";
  return (
    <button
      className={styles.handle}
      onPointerDown={(ev) => { ev.stopPropagation(); connect.start(ev); }}
      onPointerMove={(ev) => { ev.stopPropagation(); connect.move(ev); }}
      onPointerUp={(ev) => { ev.stopPropagation(); connect.finish(ev); }}
      // detail 0: a keyboard press; mouse and touch connect by dragging.
      onClick={(ev) => { ev.stopPropagation(); if (ev.detail === 0) onActivate(); }}
      aria-label={isSource ? t("board.cancelConnectFrom", { name }) : t("board.connectFrom", { name })}
      title={isSource ? t("board.cancelConnect") : t("board.connectTitle")}
      tabIndex={vertical ? -1 : undefined}
      style={{
        position: "absolute",
        [side]: -16,
        ...(vertical ? { left: size.w / 2 - 16 } : { top: size.h / 2 - 16 }),
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        ["--node-color" as string]: color,
        cursor: "crosshair",
        padding: 0,
      }}
    />
  );
}

export function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      onPointerDown={(ev) => ev.stopPropagation()}
      onClick={(ev) => { ev.stopPropagation(); onRemove(); }}
      title={t("board.remove")}
      aria-label={t("board.remove")}
      className={styles.corner}
      style={{
        ...cornerButton,
        top: -12,
        background: colors.borderSoft
      }}
    >
      <BrandIcon name="close" color={colors.textDim} size={10} />
    </button>
  );
}

import { useEffect, useRef, useState } from "react";
import { t } from "@grip/core/i18n";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./ArchBoard.module.css";
import { NodePalette } from "./NodePalette";
import { SHAPE_KEYS, TOOL_KEYS, type Shape, type Tool } from "./boardControls";
type Key = Parameters<typeof t>[0];

type Props = {
  onAddNode: (type: string) => void;
  onAddShape: (shape: Shape) => void;
  tool: Tool | null;
  onTool: (tool: Tool) => void;
};

const SHAPE_ICONS: Record<Shape, string> = { rect: "shapeRect", diamond: "shapeDiamond", ellipse: "shapeEllipse", note: "shapeNote" };
const TOOL_ICONS: Record<Tool, string> = { arrow: "arrowRight", line: "shapeLine", text: "text" };
const keyFor = (map: Record<string, string>, value: string) => Object.keys(map).find((k) => map[k] === value)!.toUpperCase();

// The board's tools, floating top left on the canvas: the built-in components behind
// one dropdown (so the canvas keeps the room), then free shapes, arrows, lines and text.
export function CanvasTools({ onAddNode, onAddShape, tool, onTool }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    popoverRef.current?.querySelector("button")?.focus();
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    window.addEventListener("pointerdown", closeOutside);
    return () => window.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      <div role="toolbar" aria-label={t("board.tools")} className={styles.toolBar}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.zoomButton}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="board-components"
          onClick={() => setOpen((value) => !value)}
        >
          <BrandIcon name="layers" color="currentColor" size={15} />
          {t("board.components")}
          <BrandIcon name="arrowDown" color="currentColor" size={12} />
        </button>
        <span className={styles.toolDivider} aria-hidden="true" />
        {(Object.keys(SHAPE_ICONS) as Shape[]).map((shape) => {
          const label = t(`board.shape.${shape}` as Key);
          const key = keyFor(SHAPE_KEYS, shape);
          return (
            <button key={shape} type="button" className={styles.zoomButton} onClick={() => onAddShape(shape)} aria-label={label} aria-keyshortcuts={key} title={`${label} (${key})`}>
              <BrandIcon name={SHAPE_ICONS[shape]} color="currentColor" size={16} />
            </button>
          );
        })}
        <span className={styles.toolDivider} aria-hidden="true" />
        {(Object.keys(TOOL_ICONS) as Tool[]).map((name) => {
          const label = t(`board.tool.${name}` as Key);
          const key = keyFor(TOOL_KEYS, name);
          return (
            <button
              key={name}
              type="button"
              className={styles.zoomButton}
              onClick={() => onTool(name)}
              aria-pressed={tool === name}
              aria-label={label}
              aria-keyshortcuts={key}
              title={`${t(`board.tool.${name}Hint` as Key)} (${key})`}
              data-active={tool === name || undefined}
            >
              <BrandIcon name={TOOL_ICONS[name]} color="currentColor" size={16} />
            </button>
          );
        })}
      </div>
      {open && (
        <div
          id="board-components"
          ref={popoverRef}
          role="dialog"
          aria-label={t("board.components")}
          className={styles.componentsPopover}
          onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}
        >
          <NodePalette onAddNode={(type) => { onAddNode(type); close(); }} />
        </div>
      )}
    </>
  );
}

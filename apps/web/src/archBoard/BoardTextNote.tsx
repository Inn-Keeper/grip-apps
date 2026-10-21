import type React from "react";
import { useEffect, useRef, useState } from "react";
import { TEXT_FONT_TOKEN, styleOf } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./ArchBoard.module.css";
import { focusAtEnd, nudgeFromKey } from "./boardControls";
import type { BoardNode } from "./types";

type PointerHandler = (e: React.PointerEvent) => void;

type Props = {
  node: BoardNode;
  drag: { down: PointerHandler; move: PointerHandler; up: PointerHandler };
  onNudge: (dx: number, dy: number) => void;
  onRemove: () => void;
  onLabel: (label: string) => void;
  // Focus picks the note, so the style panel can follow it.
  onSelect: () => void;
};

// Free text typed straight onto the board, whiteboard style: no box, grows with its lines.
// Double click or Enter edits; finishing with nothing written removes it.
export function BoardTextNote({ node: n, drag, onNudge, onRemove, onLabel, onSelect }: Props) {
  const style = styleOf(n);
  // Fresh from the Text tool: no label yet, so it opens for typing.
  const [editing, setEditing] = useState(n.label === undefined);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (editing && el) focusAtEnd(el);
  }, [editing]);

  const finish = () => {
    setEditing(false);
    const label = (editorRef.current?.innerText ?? "").replace(/\s+$/, "");
    if (!label.trim()) onRemove();
    else if (label !== n.label) onLabel(label);
  };

  return (
    <div
      className={styles.textNote}
      data-editing={editing || undefined}
      role="group"
      tabIndex={editing ? -1 : 0}
      aria-label={t("board.textNoteLabel", { text: n.label ?? "" })}
      title={editing ? undefined : t("board.editLabelHint")}
      onPointerDown={editing ? undefined : drag.down}
      onPointerMove={drag.move}
      onPointerUp={drag.up}
      onFocus={onSelect}
      onDoubleClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (editing) return;
        if (event.key === "Enter" || event.key === "F2") { event.preventDefault(); setEditing(true); }
        const nudge = nudgeFromKey(event);
        if (nudge) { event.preventDefault(); onNudge(...nudge); }
        if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onRemove(); }
      }}
      style={{
        position: "absolute",
        left: n.x,
        top: n.y,
        minWidth: 24,
        padding: "4px 6px",
        color: colors[style.color],
        fontSize: font.size[TEXT_FONT_TOKEN.text[style.size] as keyof typeof font.size],
        fontWeight: style.bold ? 700 : 400,
        textAlign: style.align,
        lineHeight: 1.45,
        whiteSpace: "pre",
        cursor: editing ? "text" : "grab",
        touchAction: "none",
        userSelect: editing ? "text" : "none",
      }}
    >
      {editing ? (
        <div
          ref={editorRef}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={t("board.textPlaceholder")}
          data-placeholder={t("board.textPlaceholder")}
          className={styles.textEditor}
          onPointerDown={(ev) => ev.stopPropagation()}
          onBlur={finish}
          onKeyDown={(ev) => {
            // Kept from the note and the board: Backspace and arrows belong to the text here.
            ev.stopPropagation();
            if (ev.key === "Escape" || (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey))) { ev.preventDefault(); ev.currentTarget.blur(); }
          }}
        >
          {n.label ?? ""}
        </div>
      ) : (
        n.label
      )}
      {!editing && (
        <button
          type="button"
          className={styles.textRemove}
          onPointerDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => { ev.stopPropagation(); onRemove(); }}
          title={t("board.remove")}
          aria-label={t("board.remove")}
        >
          <BrandIcon name="close" color={colors.textDim} size={10} />
        </button>
      )}
    </div>
  );
}

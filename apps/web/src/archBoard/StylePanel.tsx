import type React from "react";
import { ARROW_HEADS, FILL_COLORS, TEXT_ALIGNS, TEXT_COLORS, TEXT_SIZES, styleOf, type FreeStyle } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { alpha, colors } from "../lib/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./ArchBoard.module.css";
import { STYLE_SHORTCUTS } from "./freeStyle.js";
import type { BoardNode } from "./types";

type Props = { node: BoardNode; onChange: (patch: FreeStyle) => void; onDelete: () => void };
type Key = Parameters<typeof t>[0];

const SIZE_LABELS: Record<string, string> = { s: "S", m: "M", l: "L", xl: "XL" };
const ALIGN_ICONS = { left: "alignLeft", center: "alignCenter", right: "alignRight" } as const;
const HEAD_GLYPHS: Record<string, string> = { end: "→", both: "↔", none: "—" };

// Arrow keys walk the buttons (toolbar pattern); Tab still reaches each one.
function moveFocus(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const buttons = [...event.currentTarget.querySelectorAll("button")];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  buttons[(index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
}

type OptionProps = { pressed: boolean; label: string; title?: string; shortcut?: string; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties };

function Option({ pressed, label, title, shortcut, onClick, children, style }: OptionProps) {
  return (
    <button type="button" className={styles.styleButton} aria-pressed={pressed} aria-label={label} title={title ?? label} aria-keyshortcuts={shortcut} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function Swatch({ color }: { color: string | null | undefined }) {
  // null: "no fill", drawn as an empty ring.
  return <span className={styles.swatch} style={{ background: color ?? "transparent" }} />;
}

// Style for the selected item. Text, shapes and components: size, colour, alignment, bold, plus fill
// on shapes and components. Arrows and lines: colour, dashed, arrowheads.
// Mouse down never takes focus, so a text being typed stays in edit mode.
export function StylePanel({ node, onChange, onDelete }: Props) {
  const style = styleOf(node);
  const arrow = node.type === "arrow";
  return (
    <div
      role="toolbar"
      aria-label={t(arrow ? "board.style.arrowPanel" : "board.style.panel")}
      className={styles.stylePanel}
      onKeyDown={moveFocus}
      onMouseDown={(event) => event.preventDefault()}
    >
      {!arrow && (
        <div role="group" aria-label={t("board.style.size")} title={t("board.style.sizeHint")} className={styles.styleGroup}>
          {TEXT_SIZES.map((size) => (
            <Option key={size} pressed={style.size === size} label={t("board.style.sizeOption", { size: SIZE_LABELS[size] ?? size })} shortcut={`${STYLE_SHORTCUTS.bigger} ${STYLE_SHORTCUTS.smaller}`} onClick={() => onChange({ size: size as FreeStyle["size"] })}>
              {SIZE_LABELS[size]}
            </Option>
          ))}
        </div>
      )}
      <div role="group" aria-label={t("board.style.color")} className={styles.styleGroup}>
        {TEXT_COLORS.map((color) => (
          <Option key={color} pressed={style.color === color} label={t(`board.style.color.${color}` as Key)} onClick={() => onChange({ color: color as FreeStyle["color"] })}>
            <Swatch color={colors[color as keyof typeof colors]} />
          </Option>
        ))}
      </div>
      {!arrow && node.type !== "text" && (
        <div role="group" aria-label={t("board.style.fill")} className={styles.styleGroup}>
          {FILL_COLORS.map((fill) => {
            const name = fill === "none" ? t("board.style.fill.none") : t(`board.style.color.${fill}` as Key);
            return (
              <Option key={fill} pressed={style.fill === fill} label={t("board.style.fillOption", { color: name })} onClick={() => onChange({ fill: fill as FreeStyle["fill"] })}>
                <Swatch color={fill === "none" ? null : alpha(colors[fill as keyof typeof colors], 0.4)} />
              </Option>
            );
          })}
        </div>
      )}
      {!arrow && (
        <div role="group" aria-label={t("board.style.align")} className={styles.styleGroup}>
          {TEXT_ALIGNS.map((align) => {
            const a = align as keyof typeof ALIGN_ICONS;
            const label = t(`board.style.align.${align}` as Key);
            return (
              <Option key={align} pressed={style.align === align} label={label} title={`${label} (${STYLE_SHORTCUTS[a]})`} shortcut={STYLE_SHORTCUTS[a]} onClick={() => onChange({ align: a })}>
                <BrandIcon name={ALIGN_ICONS[a]} color="currentColor" size={16} />
              </Option>
            );
          })}
        </div>
      )}
      {!arrow && (
        <div className={styles.styleGroup}>
          <Option pressed={style.bold} label={t("board.style.bold")} title={`${t("board.style.bold")} (Ctrl/⌘ B)`} shortcut={STYLE_SHORTCUTS.bold} onClick={() => onChange({ bold: !style.bold })} style={{ fontWeight: 800 }}>
            B
          </Option>
        </div>
      )}
      {arrow && (
        <div className={styles.styleGroup}>
          <Option pressed={style.dashed} label={t("board.style.dashed")} onClick={() => onChange({ dashed: !style.dashed })}>
            <svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" /></svg>
          </Option>
        </div>
      )}
      {arrow && (
        <div role="group" aria-label={t("board.style.heads")} className={styles.styleGroup}>
          {ARROW_HEADS.map((heads) => (
            <Option key={heads} pressed={style.heads === heads} label={t(`board.style.heads.${heads}` as Key)} onClick={() => onChange({ heads: heads as FreeStyle["heads"] })}>
              {HEAD_GLYPHS[heads]}
            </Option>
          ))}
        </div>
      )}
      {/* Last, set apart: the one action here that removes rather than restyles. */}
      <div className={styles.styleGroup}>
        <button type="button" className={`${styles.styleButton} ${styles.deleteButton}`} aria-label={t("board.deleteSelected")} aria-keyshortcuts="Delete Backspace" title={`${t("board.deleteSelected")} (Delete)`} onClick={onDelete}>
          <BrandIcon name="trash" color="currentColor" size={16} />
        </button>
      </div>
    </div>
  );
}

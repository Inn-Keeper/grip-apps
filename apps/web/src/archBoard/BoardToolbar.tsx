import { t } from "@grip/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { Combobox } from "../components/Combobox";
import styles from "./ArchBoard.module.css";

type Props = {
  status: { text: string; dirty: boolean };
  history: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void };
  talk: { open: boolean; answered: number; onToggle: () => void };
  save: { pending: boolean; onSave: () => void };
  onClear: () => void;
  arrows: { options: { label: string; value: string }[]; selectedId: string | null; onSelect: (id: string | null) => void };
};

// Slim toolbar: editing controls for the canvas right under it.
export function BoardToolbar({ status, history, talk, save, onClear, arrows }: Props) {
  const empty = arrows.options.length === 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
      <span aria-live="polite" style={{ fontSize: font.size.small, fontWeight: 600, color: status.dirty ? colors.warningBright : colors.successBright, marginRight: 4 }}>
        {status.text}
      </span>
      <button type="button" className={styles.toolbarButton} onClick={history.onUndo} disabled={!history.canUndo}>{t("board.undo")}</button>
      <button type="button" className={styles.toolbarButton} onClick={history.onRedo} disabled={!history.canRedo}>{t("board.redo")}</button>
      <button
        type="button"
        className={styles.toolbarButton}
        aria-pressed={talk.open}
        onClick={talk.onToggle}
        style={{ display: "flex", alignItems: "center", gap: 5, color: talk.open ? colors.accentBright : undefined, borderColor: talk.open ? colors.accent : undefined }}
      >
        <BrandIcon name="spark" color={talk.open ? colors.accentBright : colors.textDim} size={13} />
        {t("talk.title")} ({talk.answered}/{TALK_TRACK_SECTIONS.length})
      </button>
      <button type="button" className={styles.toolbarButton} onClick={save.onSave} disabled={save.pending} aria-busy={save.pending} style={{ color: colors.successBright }}>
        {save.pending ? t("common.saving") : t("common.save")}
      </button>
      <button type="button" className={styles.toolbarButton} onClick={onClear}>{t("board.clear")}</button>
      {/* Combobox, not a native select: the OS dropdown ignores the app's
          palette, so this one control rendered light on a dark board. */}
      <div className={styles.connectionRow} style={{ marginLeft: "auto", color: colors.textDim }}>
        <span>{t("board.editArrow")}</span>
        <Combobox
          value={arrows.selectedId ?? ""}
          onChange={(value) => arrows.onSelect(value || null)}
          disabled={empty}
          placeholder={empty ? t("board.edgeNone") : t("board.edgeSelect")}
          options={[{ label: empty ? t("board.edgeNone") : t("board.edgeSelect"), value: "" }, ...arrows.options]}
          style={{ minWidth: 240 }}
          triggerStyle={{ minHeight: 32, padding: "5px 9px", fontSize: font.size.small }}
        />
      </div>
    </div>
  );
}

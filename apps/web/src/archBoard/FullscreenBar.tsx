import { formatClock } from "@grip/core/designTimer";
import { t } from "@grip/core/i18n";
import { colors } from "../lib/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./ArchBoard.module.css";
import type { DesignRound } from "./useDesignRound";
import type { RailAction } from "./WorkflowSteps";

type Props = {
  status: { text: string; dirty: boolean };
  save: { pending: boolean; onSave: () => void };
  history: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void };
  /** The running round or sprint, or null when no clock was started. */
  round: DesignRound | null;
  /** Ends a running sprint; null when there is none to end. */
  onFinishSprint: (() => void) | null;
  action: RailAction;
};

// Fullscreen is for drawing: this strip carries only what drawing needs from the page
// outside it (save, undo, the clock and the step's action).
export function FullscreenBar({ status, save, history, round, onFinishSprint, action }: Props) {
  return (
    <div className={`${styles.toolBar} ${styles.fullscreenBar}`} role="toolbar" aria-label={t("board.fullscreenBar")}>
      <span className={styles.fullscreenStatus} aria-live="polite" style={{ color: status.dirty ? colors.warningBright : colors.textDim }}>
        {status.text}
      </span>
      <button type="button" className={styles.zoomButton} onClick={save.onSave} disabled={save.pending}>
        {save.pending ? t("common.saving") : t("common.save")}
      </button>
      <button type="button" className={styles.zoomButton} onClick={history.onUndo} disabled={!history.canUndo}>{t("board.undo")}</button>
      <button type="button" className={styles.zoomButton} onClick={history.onRedo} disabled={!history.canRedo}>{t("board.redo")}</button>
      {round && (
        <span className={styles.fullscreenClock} style={{ color: round.overrun ? colors.dangerBright : colors.textBright }}>
          {round.overrun ? formatClock(-round.overrunMs) : formatClock(round.remainingMs)}
          <span className={styles.fullscreenPhase}>{round.overrun ? t("timer.overtime") : round.phase.label}</span>
        </span>
      )}
      {onFinishSprint && (
        <button type="button" className={styles.zoomButton} onClick={onFinishSprint}>{t("sprint.finish")}</button>
      )}
      <button type="button" className={styles.fullscreenAction} onClick={action.onClick} disabled={action.disabled} style={{
          background: colors.accent,
          color: colors.onAccent
        }}>
        <BrandIcon name={action.icon} color={colors.onAccent} size={13} />
        {action.label}
      </button>
    </div>
  );
}

import { t } from "@grip/core/i18n";
import styles from "./ArchBoard.module.css";
import { MAX_SCALE, MIN_SCALE } from "./viewport.js";

type Props = { scale: number; onZoomIn: () => void; onZoomOut: () => void; onReset: () => void; onFit: () => void };

// Always-visible zoom controls, so zooming is discoverable without knowing the gestures.
export function ViewportControls({ scale, onZoomIn, onZoomOut, onReset, onFit }: Props) {
  const percent = Math.round(scale * 100);
  return (
    <div className={styles.zoomControls} role="toolbar" aria-label={t("board.zoomControls")}>
      <button type="button" className={styles.zoomButton} onClick={onZoomOut} disabled={scale <= MIN_SCALE} title={`${t("board.zoomOut")} (−)`} aria-label={t("board.zoomOut")}>−</button>
      <button type="button" className={`${styles.zoomButton} ${styles.zoomPercent}`} onClick={onReset} title={t("board.zoomReset")} aria-label={t("board.zoomReset")}>
        {percent}%
      </button>
      <button type="button" className={styles.zoomButton} onClick={onZoomIn} disabled={scale >= MAX_SCALE} title={`${t("board.zoomIn")} (+)`} aria-label={t("board.zoomIn")}>+</button>
      <button type="button" className={styles.zoomButton} onClick={onFit} title={`${t("board.fitHint")} (0)`}>{t("board.fit")}</button>
    </div>
  );
}

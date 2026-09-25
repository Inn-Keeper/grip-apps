import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { SavedBoards } from "./SavedBoards";
import styles from "./ArchBoard.module.css";
import type { AugmentedScenario, BoardSummary } from "./types";
import { ErrorText } from "../components/ErrorText";

type Props = {
  open: boolean;
  onToggle: (open: boolean) => void;
  boards: BoardSummary[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  activeBoardId: string | null;
  allScenarios: AugmentedScenario[];
  onLoad: (board: BoardSummary) => void;
  onDelete: (id: string) => void;
  deleteError: Error | null;
};

// Saved boards load only once this is opened.
export function SavedBoardsPanel({ open, onToggle, boards, loading, error, onRetry, activeBoardId, allScenarios, onLoad, onDelete, deleteError }: Props) {
  return (
    <details className={styles.savedBoards} open={open} onToggle={(event) => onToggle(event.currentTarget.open)}>
      <summary className={styles.savedSummary}>
        <BrandIcon name="story" color={colors.accentBright} size={16} />
        <span style={{ flex: 1 }}>{t("board.savedBoards")}</span>
        {!loading && <span style={{ color: colors.textFaint, fontSize: font.size.small }}>{boards.length}</span>}
      </summary>
      <div style={{ padding: "0 14px 14px" }}>
        {loading ? (
          <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.small }}>{t("board.boardsLoading")}</p>
        ) : error ? (
          <ErrorText>
            {t("board.boardsError", { message: error.message })}{" "}
            <button type="button" className={styles.toolbarButton} onClick={onRetry}>{t("board.retry")}</button>
          </ErrorText>
        ) : (
          <SavedBoards activeBoardId={activeBoardId} allScenarios={allScenarios} boards={boards} onDelete={onDelete} onLoad={onLoad} />
        )}
        {deleteError && <ErrorText margin="10px 0 0">{t("board.deleteFailed", { message: deleteError.message })}</ErrorText>}
      </div>
    </details>
  );
}

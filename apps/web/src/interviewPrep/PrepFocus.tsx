import type { ReactNode } from "react";
import { t } from "@grip/core/i18n";
import { openInBoard } from "../lib/boardHandoff";
import type { PrepFocus as Focus } from "../lib/prepPlanHandoff";
import styles from "./InterviewPrep.module.css";

const goToStories = () => window.dispatchEvent(new CustomEvent("grip:navigate", { detail: "stories" }));

// Newcomer view after the first-run wizard: the next-up card, plus links to what setup also built.
export function PrepFocus({ children, focus, onShowAll }: { children: ReactNode; focus: Focus; onShowAll: () => void }) {
  const { scenarioId, boardId } = focus;
  return (
    <main className={styles.focus} aria-label={t("prep.mainLabel")}>
      {children}
      <p className={styles.focusHint}>{t("prep.focus.hint")}</p>
      <nav className={styles.focusReady} aria-label={t("prep.focus.ready")}>
        <span>{t("prep.focus.ready")}</span>
        <button type="button" className={styles.focusLink} onClick={goToStories}>
          {t("prep.focus.stories")}
        </button>
        {scenarioId && (
          <button type="button" className={styles.focusLink} onClick={() => openInBoard(boardId ? { scenarioId, boardId } : { scenarioId })}>
            {t("prep.focus.board")}
          </button>
        )}
      </nav>
      <button type="button" className={styles.focusLink} onClick={onShowAll}>
        {t("prep.focus.showAll")}
      </button>
    </main>
  );
}

import type { ReactNode } from "react";
import { t } from "@grip/core/i18n";
import styles from "./InterviewPrep.module.css";

// Newcomer view after the first-run wizard: only the next-up card, rails hidden.
export function PrepFocus({ children, onShowAll }: { children: ReactNode; onShowAll: () => void }) {
  return (
    <main className={styles.focus} aria-label={t("prep.mainLabel")}>
      {children}
      <p className={styles.focusHint}>{t("prep.focus.hint")}</p>
      <button type="button" className={styles.focusShowAll} onClick={onShowAll}>
        {t("prep.focus.showAll")}
      </button>
    </main>
  );
}

import { formatClock } from "@grip/core/designTimer";
import { t } from "@grip/core/i18n";
import { sprintStats } from "@grip/core/sprintLog";
import type { DesignSprint } from "@grip/core/api";
import { ErrorText } from "../components/ErrorText";
import styles from "./SprintLog.module.css";

const SPRINT_SECONDS = 600;
const BARS = 16;

// The sprint trend: time to a full diagram per run, and the checks missed most often.
export function SprintLog({ sprints, saveError }: { sprints: DesignSprint[]; saveError: Error | null }) {
  const stats = sprintStats(sprints);
  if (stats.count === 0 && !saveError) return null;
  return (
    <section className={styles.log} aria-labelledby="sprint-log-title">
      <h3 id="sprint-log-title" className={styles.title}>{t("sprint.logTitle")}</h3>
      {saveError && <ErrorText>{t("sprint.saveFailed", { message: saveError.message })}</ErrorText>}
      {stats.count > 0 && (
        <>
          <p className={styles.stats}>
            {t("sprint.logStats", {
              count: stats.count,
              best: stats.bestSeconds === null ? "–" : formatClock(stats.bestSeconds * 1000),
              finished: stats.finishedPct ?? 0,
            })}
          </p>
          <div className={styles.bars} role="img" aria-label={t("sprint.logChart")}>
            {sprints.slice(-BARS).map((sprint, i) => (
              <span
                key={sprint.id ?? i}
                className={`${styles.bar}${sprint.ranOut ? ` ${styles.barOut}` : ""}`}
                title={formatClock(sprint.seconds * 1000)}
                style={{ height: `${Math.max(4, (sprint.seconds / SPRINT_SECONDS) * 100)}%` }}
              />
            ))}
          </div>
          {stats.topMissed.length > 0 && (
            <>
              <p className={styles.missedTitle}>{t("sprint.logMissed")}</p>
              <ul className={styles.missed}>
                {stats.topMissed.map((item) => <li key={item.label}>{item.count}× {item.label}</li>)}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

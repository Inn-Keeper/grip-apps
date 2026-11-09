import { t } from "@grip/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font } from "../lib/tokens";
import { HeadlineMetric } from "../components/HeadlineMetric";
import { WorkspacePanel } from "../components/WorkspaceLayout";
import styles from "./ArchBoard.module.css";

type Props = {
  result: { score: number; earned: number; totalPts: number } | null;
  reasoning: number | null;
  written: number;
};

// Checklist accuracy, assessed reasoning and draft coverage answer different questions.
export function ScorePanel({ result, reasoning, written }: Props) {
  return (
    <WorkspacePanel>
      {result ? (
        <HeadlineMetric label={t("board.designChecks")} value={result.score} unit="%" pct={result.score} hint={t("board.scoreHint", { earned: result.earned, total: result.totalPts })} />
      ) : (
        <div>
          <div style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10
            }}>
            <span style={{
                color: colors.textDim,
                fontSize: font.size.small,
                fontWeight: 700
              }}>{t("board.designChecks")}</span>
            <span style={{
                color: colors.textFaint,
                fontSize: font.size.hero,
                fontWeight: 800,
                lineHeight: 1
              }}>—</span>
          </div>
          <p style={{
              margin: "8px 0 0",
              color: colors.textFaint,
              fontSize: font.size.label
            }}>{t("board.scoreEmpty")}</p>
        </div>
      )}
      <p className={styles.progressHint}>{t("board.designChecksHint")}</p>
      <dl className={styles.progressSignals}>
        <div><dt>{t("board.reasoningLabel")}</dt><dd>{reasoning === null ? t("board.reasoningUnassessed") : t("board.reasoningAssessed", { score: reasoning })}</dd></div>
        <div><dt>{t("board.draftLabel")}</dt><dd>{t("talk.drafted", { answered: written, total: TALK_TRACK_SECTIONS.length })}</dd></div>
      </dl>
    </WorkspacePanel>
  );
}

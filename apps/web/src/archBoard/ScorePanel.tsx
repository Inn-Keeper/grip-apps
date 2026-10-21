import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { HeadlineMetric } from "../components/HeadlineMetric";
import { WorkspacePanel } from "../components/WorkspaceLayout";

type Props = {
  result: { score: number; earned: number; totalPts: number } | null;
};

// Right rail, first: the design score.
export function ScorePanel({ result }: Props) {
  return (
    <WorkspacePanel>
      {result ? (
        <HeadlineMetric label={t("board.scoreLabel")} value={result.score} unit="%" pct={result.score} hint={t("board.scoreHint", { earned: result.earned, total: result.totalPts })} />
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
              }}>{t("board.scoreLabel")}</span>
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
    </WorkspacePanel>
  );
}

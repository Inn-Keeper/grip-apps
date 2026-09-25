import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { HeadlineMetric } from "../components/HeadlineMetric";
import { WorkspacePanel } from "../components/WorkspaceLayout";

type Props = {
  result: { score: number; earned: number; totalPts: number } | null;
  cost: number;
  budget: number;
  maint: number;
};

// Right rail, first: the design score, then the live budget and maintenance load.
export function ScorePanel({ result, cost, budget, maint }: Props) {
  const overBudget = cost > budget;
  return (
    <WorkspacePanel>
      {result ? (
        <HeadlineMetric label={t("board.scoreLabel")} value={result.score} unit="%" pct={result.score} hint={t("board.scoreHint", { earned: result.earned, total: result.totalPts })} />
      ) : (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.borderSoft}` }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: colors.textDim, fontSize: font.size.small, fontWeight: 700 }}>{t("board.scoreLabel")}</span>
            <span style={{ color: colors.textFaint, fontSize: font.size.hero, fontWeight: 800, lineHeight: 1 }}>—</span>
          </div>
          <p style={{ margin: "8px 0 0", color: colors.textFaint, fontSize: font.size.label }}>{t("board.scoreEmpty")}</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: font.size.small, fontWeight: 600 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: overBudget ? colors.dangerBright : colors.textDim }}>
          <BrandIcon name="cost" color={overBudget ? colors.dangerBright : colors.textDim} size={14} />
          {t("board.costLine", { cost, budget })}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: colors.textDim }}>
          <BrandIcon name="maintenance" color={colors.textDim} size={14} />
          {t("board.maintLine", { value: maint })}
        </span>
      </div>
    </WorkspacePanel>
  );
}

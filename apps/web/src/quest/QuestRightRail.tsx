import { PACE_GOAL_PER_WEEK, PACE_WINDOW_DAYS } from "@grip/core/funnel";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import type { VelocityReport } from "@grip/core/pipeline";
import { BrandIcon } from "../components/BrandIcon";
import { CountUp, GlowBar } from "../components/GlowBar";
import { HeadlineMetric } from "../components/HeadlineMetric";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";

type FunnelSummary = {
  applicationsPerWeek: number;
  reached: Record<string, number>;
  rates: { contactedToApplied: number; appliedToInterviewing: number; interviewingToOffer: number };
  signals: string[];
};

// Right rail: status (application pace, then conversion), then insights (rule 5).
export function QuestRightRail({ funnel, velocity, velocityError, velocityLoading }: {
  funnel: FunnelSummary;
  velocity?: VelocityReport;
  velocityError?: Error | null;
  velocityLoading: boolean;
}) {
  const pace = funnel.applicationsPerWeek;
  const conversions = [
    { label: t("funnel.contactedToApplied"), rate: funnel.rates.contactedToApplied, from: funnel.reached.Contacted ?? 0, to: funnel.reached.Applied ?? 0 },
    { label: t("funnel.appliedToInterviewing"), rate: funnel.rates.appliedToInterviewing, from: funnel.reached.Applied ?? 0, to: funnel.reached.Interviewing ?? 0 },
    { label: t("funnel.interviewingToOffer"), rate: funnel.rates.interviewingToOffer, from: funnel.reached.Interviewing ?? 0, to: funnel.reached.Offer ?? 0 },
  ];
  const velocityStages = velocity?.stages ?? [];

  return (
    <>
      <WorkspacePanel>
        {/* The screen's headline (rule 17): the number you can move this week. */}
        <HeadlineMetric
          label={t("quest.paceLabel")}
          value={pace}
          decimals={1}
          pct={(pace / PACE_GOAL_PER_WEEK) * 100}
          hint={t("quest.paceHint", { goal: PACE_GOAL_PER_WEEK, days: PACE_WINDOW_DAYS })}
        />
        <div style={{ color: colors.textDim, fontSize: font.size.label, fontWeight: 800, marginBottom: 10 }}>{t("quest.conversion")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {conversions.map((row, index) => (
            <div key={row.label}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: font.size.small }}>
                <span style={{ flex: 1, color: colors.text }}>{row.label}</span>
                <span style={{ color: colors.textFaint }}>{row.to}/{row.from}</span>
                <span style={{ width: 40, textAlign: "right", color: colors.textBright, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                  <CountUp value={Math.round(row.rate * 100)} durationMs={1600 + index * 200} />%
                </span>
              </div>
              <GlowBar pct={row.rate * 100} marginTop={6} />
            </div>
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceTitle icon={<BrandIcon name="accuracy" color={colors.successBright} size={17} />} title={t("quest.insights")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          {/* ponytail: insight sentences come from core in English only; translate when core gets i18n keys. */}
          {funnel.signals.slice(0, 2).map((signal) => (
            <p key={signal} style={{ margin: 0, fontSize: font.size.small, lineHeight: 1.5, color: colors.textDim }}>{signal}</p>
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel>
        <WorkspaceTitle
          icon={<BrandIcon name="calendar" color={colors.accentBright} size={17} />}
          title={t("quest.velocityTitle")}
          subtitle={t("quest.velocitySub")}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14, fontSize: font.size.small }}>
          {velocityLoading && velocityStages.length === 0 && <p style={{ margin: 0, color: colors.textFaint }}>{t("quest.velocityLoading")}</p>}
          {velocityError && <p style={{ margin: 0, color: colors.dangerBright }}>{t("quest.velocityError")}</p>}
          {!velocityLoading && !velocityError && velocityStages.length === 0 && (
            <p style={{ margin: 0, color: colors.textFaint }}>{t("quest.velocityEmpty")}</p>
          )}
          {velocityStages.map((stage, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: 1, color: colors.textDim, fontWeight: 600 }}>{stage.fromStage} → {stage.toStage}</span>
              <span style={{ color: colors.textBright, fontWeight: 800 }}>{t("quest.days", { days: Number(stage.avgDays).toFixed(1) })}</span>
            </div>
          ))}
        </div>
      </WorkspacePanel>
    </>
  );
}

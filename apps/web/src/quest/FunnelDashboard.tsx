import { STATUS_STYLES } from "@grip-apps/core/contacts";
import { t } from "@grip-apps/core/i18n";
import { colors, tints } from "@grip-apps/core/tokens";

type FunnelSummary = {
  active: number;
  applicationsPerWeek: number;
  reached: Record<string, number>;
  rates: { contactedToApplied: number; appliedToInterviewing: number; interviewingToOffer: number };
  statuses: string[];
  counts: Record<string, number>;
  signals: string[];
};

const percent = (value: number) => Math.round(value * 100);

// Web twin of the mobile funnel dashboard: same buildFunnelSummary input.
export function FunnelDashboard({ summary, compact = false }: { summary: FunnelSummary; compact?: boolean }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: compact ? 8 : 12,
        padding: compact ? 14 : "16px 18px",
        marginBottom: compact ? 0 : 16,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 12 : 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: compact ? 13 : 15, fontWeight: 700, color: colors.textBright }}>{t("funnel.title")}</div>
          <div style={{ fontSize: 11, color: colors.textFaint }}>{t("funnel.subtitle")}</div>
        </div>
        <span
          style={{
            padding: "3px 10px",
            background: tints.accentSoft,
            borderRadius: 20,
            color: colors.accentBright,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {t("funnel.active", { count: summary.active })}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr)", gap: compact ? 8 : 10 }}>
        <Metric label={t("funnel.appsPerWeek")} value={summary.applicationsPerWeek} color={colors.success} />
        <Metric label={t("funnel.interviews")} value={summary.reached.Interviewing ?? 0} color={colors.warning} />
        <Metric label={t("funnel.offers")} value={summary.reached.Offer ?? 0} color={STATUS_STYLES.Offer?.color ?? ""} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ConversionRow
          label={t("funnel.contactedToApplied")}
          value={summary.rates.contactedToApplied}
          detail={`${summary.reached.Applied}/${summary.reached.Contacted}`}
          color={colors.success}
        />
        <ConversionRow
          label={t("funnel.appliedToInterviewing")}
          value={summary.rates.appliedToInterviewing}
          detail={`${summary.reached.Interviewing}/${summary.reached.Applied}`}
          color={colors.warning}
        />
        <ConversionRow
          label={t("funnel.interviewingToOffer")}
          value={summary.rates.interviewingToOffer}
          detail={`${summary.reached.Offer}/${summary.reached.Interviewing}`}
          color={STATUS_STYLES.Offer?.color ?? ""}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {summary.statuses.map((status) => (
          <span
            key={status}
            style={{
              padding: "3px 10px",
              background: `${STATUS_STYLES[status]?.color ?? ""}20`,
              borderRadius: 20,
              color: STATUS_STYLES[status]?.color ?? "",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {status}: {summary.counts[status] ?? 0}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {summary.signals.slice(0, 2).map((signal) => (
          <span key={signal} style={{ fontSize: 12, lineHeight: 1.45, color: colors.textDim }}>
            – {signal}
          </span>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string | undefined }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: colors.well,
        border: `1px solid ${color}40`,
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: colors.textFaint }}>{label}</div>
    </div>
  );
}

function ConversionRow({ label, value, detail, color }: { label: string; value: number; detail: string; color: string | undefined }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: colors.textDim }}>{label}</span>
        <span style={{ fontSize: 11, color: colors.textFaint }}>{detail}</span>
        <span style={{ width: 38, textAlign: "right", fontSize: 11.5, fontWeight: 700, color }}>
          {percent(value)}%
        </span>
      </div>
      <div style={{ height: 6, background: colors.well, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${percent(value)}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

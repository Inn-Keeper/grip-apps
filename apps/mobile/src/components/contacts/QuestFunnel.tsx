import { Text, View } from "react-native";
import { buildFunnelSummary } from "@grip-apps/core/funnel";
import { STATUS_STYLES } from "@grip-apps/core/contacts";
import { t } from "@grip-apps/core/i18n";
import { colors } from "@/theme";
import { Badge } from "@/components/ui";

type FunnelSummary = ReturnType<typeof buildFunnelSummary>;

function percent(value: number) {
  return Math.round(value * 100);
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 56,
        padding: 10,
        backgroundColor: colors.well,
        borderWidth: 1,
        borderColor: `${color}40`,
        borderRadius: 8,
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "800", color }}>{value}</Text>
      <Text numberOfLines={1} style={{ fontSize: 10, color: colors.textFaint }}>
        {label}
      </Text>
    </View>
  );
}

function ConversionRow({ label, value, detail, color }: { label: string; value: number; detail: string; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ flex: 1, fontSize: 11.5, fontWeight: "600", color: colors.textDim }}>{label}</Text>
        <Text style={{ fontSize: 11, color: colors.textFaint }}>{detail}</Text>
        <Text style={{ width: 38, textAlign: "right", fontSize: 11.5, fontWeight: "700", color }}>
          {percent(value)}%
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.well, borderRadius: 999, overflow: "hidden" }}>
        <View style={{ width: `${percent(value)}%`, height: "100%", backgroundColor: color, borderRadius: 999 }} />
      </View>
    </View>
  );
}

export function QuestFunnel({ summary }: { summary: FunnelSummary }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textBright }}>{t("funnel.title")}</Text>
          <Text style={{ fontSize: 11, color: colors.textFaint }}>{t("funnel.subtitle")}</Text>
        </View>
        <Badge label={t("funnel.active", { count: summary.active })} color={colors.accent} />
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Metric label={t("funnel.appsPerWeek")} value={String(summary.applicationsPerWeek)} color={colors.success} />
        <Metric label={t("funnel.interviews")} value={String(summary.reached.Interviewing)} color={colors.warning} />
        <Metric label={t("funnel.offers")} value={String(summary.reached.Offer)} color={STATUS_STYLES.Offer.color} />
      </View>

      <View style={{ gap: 8 }}>
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
          color={STATUS_STYLES.Offer.color}
        />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {summary.statuses.map((status: string) => (
          <Badge key={status} label={`${status}: ${summary.counts[status] ?? 0}`} color={STATUS_STYLES[status].color} />
        ))}
      </View>

      <View style={{ gap: 5 }}>
        {summary.signals.slice(0, 2).map((signal: string) => (
          <Text key={signal} style={{ fontSize: 11.5, lineHeight: 16, color: colors.textDim }}>
            - {signal}
          </Text>
        ))}
      </View>
    </View>
  );
}

import { Text, View } from "react-native";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@/theme";

type Props = { label: string; pct: number; count: number };

// Prep's headline, as on web: how ready the chosen techs are. Untested techs count as 0.
export function ReadinessCard({ label, pct, count }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${pct}%`}
      style={{ padding: 14, gap: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, boxShadow: shadow.card, backgroundColor: colors.surface }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={{ flex: 1, fontSize: font.size.body, fontWeight: "700", color: colors.textDim }}>{label}</Text>
        <Text style={{ fontSize: font.size.stat, fontWeight: "800", color: colors.textBright }}>
          {pct}
          <Text style={{ fontSize: font.size.bodyMd, color: colors.textDim }}>%</Text>
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.bgDeep, overflow: "hidden" }}>
        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: colors.accent }} />
      </View>
      <Text style={{ fontSize: font.size.label, lineHeight: 16, color: colors.textFaint }}>
        {`${t("prep.readinessHint", { count })} · ${t("prep.readinessInfo")}`}
      </Text>
    </View>
  );
}

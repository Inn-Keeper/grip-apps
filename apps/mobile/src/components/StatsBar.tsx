import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { RANKS, CORRECT_XP, PERFECT_QUIZ_BONUS, rankForXp } from "@grip-apps/core/gamification";
import { t } from "@grip-apps/core/i18n";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import type { Scores } from "@/lib/useScores";

type Props = { scores: Scores; onDrill: () => void; drillActive: boolean };

export function StatsBar({ scores, onDrill, drillActive }: Props) {
  const rank = rankForXp(scores.xp);
  const next = RANKS[RANKS.indexOf(rank) + 1];
  const progress = next ? (scores.xp - rank.min) / (next.min - rank.min) : 1;

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withSpring(progress, { damping: 18, stiffness: 90 });
  }, [progress, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  const totals = Object.values(scores.answers).reduce(
    (acc, s) => ({ correct: acc.correct + s.correct, wrong: acc.wrong + s.wrong }),
    { correct: 0, wrong: 0 }
  );
  const attempts = totals.correct + totals.wrong;
  const accuracy = attempts ? Math.round((totals.correct / attempts) * 100) : null;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><BrandIcon name="rank" color={colors.accentBright} size={16} /><Text style={{ fontSize: 14, fontWeight: "700", color: colors.textBright }}>{t(`enum.rank.${rank.name}` as Parameters<typeof t>[0])}</Text></View>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textDim }}>{scores.xp} XP</Text>
        {accuracy !== null && (
          <Text style={{ fontSize: 12, fontWeight: "600", color: accuracy >= 70 ? colors.success : colors.warning }}>
            {t("prep.accuracySummary", { pct: accuracy, count: attempts })}
          </Text>
        )}
        <TouchableOpacity
          onPress={onDrill}
          disabled={drillActive}
          style={{
            marginLeft: "auto",
            paddingHorizontal: 12,
            paddingVertical: 5,
            backgroundColor: tints.accentSoft,
            borderWidth: 1,
            borderColor: `${colors.accent}60`,
            borderRadius: 8,
            opacity: drillActive ? 0.5 : 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><BrandIcon name="drill" color={colors.accentBright} size={13} /><Text style={{ fontSize: 11, fontWeight: "600", color: colors.accentBright }}>{t("prep.drillWeakest")}</Text></View>
        </TouchableOpacity>
      </View>

      <View style={{ height: 6, backgroundColor: colors.well, borderRadius: 3, overflow: "hidden" }}>
        <Animated.View style={[{ height: "100%", backgroundColor: colors.accent, borderRadius: 3 }, fillStyle]} />
      </View>

      <Text style={{ fontSize: 10.5, color: colors.textFaint }}>
        {next ? `${t("prep.xpToNext", { xp: next.min - scores.xp, rank: t(`enum.rank.${next.name}` as Parameters<typeof t>[0]) })} · ` : ""}
        {t("prep.xpRules", { correct: CORRECT_XP, bonus: PERFECT_QUIZ_BONUS })}
      </Text>
    </View>
  );
}

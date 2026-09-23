import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { RANKS, CORRECT_XP, PERFECT_QUIZ_BONUS, rankForXp } from "@grip/core/gamification";
import { t } from "@grip/core/i18n";
import { colors } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import type { Scores } from "@/lib/useScores";

// Progress only; the drill actions live in NextUpCard.
type Props = { scores: Scores };

export function StatsBar({ scores }: Props) {
  const rank = rankForXp(scores.xp);
  const next = RANKS[RANKS.indexOf(rank) + 1];
  const progress = next ? (scores.xp - rank.min) / (next.min - rank.min) : 1;

  const fill = useSharedValue(0);
  useEffect(() => {
    // Eased, not a spring: a spring overshoots and pulls back, which reads as XP taken away.
    fill.value = withTiming(progress, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [progress, fill]);

  // Flash the bar when XP lands, so earning it is visible outside the quiz.
  const flash = useSharedValue(1);
  const previousXp = useRef(scores.xp);
  useEffect(() => {
    if (scores.xp > previousXp.current) {
      flash.value = withSequence(withTiming(0.45, { duration: 140 }), withTiming(1, { duration: 320 }));
    }
    previousXp.current = scores.xp;
  }, [scores.xp, flash]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%`, opacity: flash.value }));

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

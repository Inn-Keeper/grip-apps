import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CORRECT_XP, PERFECT_QUIZ_BONUS } from "@grip/core/gamification";
import { difficultyByKey, isTimedTier } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { AUTO_NEXT_MS } from "@grip/core/quizPrefs";
import { useCountUp } from "@/lib/useCountUp";
import { colors, font, shadow } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { DifficultyIcon } from "./DifficultyIcon";
import { QuizView } from "./QuizView";

export type Drill = {
  questions: { tech: string; color: string; q: { question: string; options: string[]; correct: number } }[];
  index: number;
  answered: number | null;
  correctCount: number;
  done: boolean;
  difficulty: string;
  // When the current question appeared, for the Thunderstorm speed bonus.
  shownAt: number;
  // Bonus the last answer earned, and the session's total.
  lastBonus: number;
  bonusXp: number;
};

type Props = {
  drill: Drill;
  onAnswer: (i: number) => void;
  onNext: () => void;
  onExit: () => void;
  /** Repeats the same techs and tier; omitted inside the mock loop. */
  onRestart?: () => void;
  /** Move on by itself after a correct answer. */
  autoNext?: boolean;
};

export function DrillSession({ drill, onAnswer, onNext, onExit, onRestart, autoNext = false }: Props) {
  const tier = difficultyByKey(drill.difficulty);
  const perAnswerXp = tier?.xp ?? CORRECT_XP;
  const shownCorrect = useCountUp(drill.done ? drill.correctCount : 0);

  // Auto-next, as on web: a correct answer moves on once its +XP has landed. Wrong answers
  // wait for Next, since reading the right answer is the point. Next, Exit or unmount cancel it.
  const answeredCorrectly = !drill.done && drill.answered !== null && drill.answered === drill.questions[drill.index]?.q.correct;
  const advance = useRef(onNext);
  advance.current = onNext;
  useEffect(() => {
    if (!autoNext || !answeredCorrectly) return;
    const id = setTimeout(() => advance.current(), AUTO_NEXT_MS);
    return () => clearTimeout(id);
  }, [autoNext, answeredCorrectly, drill.index]);

  if (drill.done) {
    const perfect = drill.correctCount === drill.questions.length;
    return (
      <Animated.View
        entering={FadeInDown.springify()}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSoft, boxShadow: shadow.card,
          borderRadius: 14,
          padding: 28,
          alignItems: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${perfect ? colors.success : colors.accent}20`,
            borderWidth: 1,
            borderColor: `${perfect ? colors.success : colors.accent}60`,
          }}
        >
          <BrandIcon name={perfect ? "rank" : drill.correctCount >= drill.questions.length / 2 ? "spark" : "story"} color={perfect ? colors.successBright : colors.accentBright} size={25} />
        </View>
        <Text style={{ fontSize: font.size.headingLg, fontWeight: "700", color: colors.textBright }}>
          {shownCorrect} / {drill.questions.length}
        </Text>
        <Text style={{ fontSize: font.size.body, color: colors.textDim, textAlign: "center" }}>
          {t("prep.drillResult", {
            xp: drill.correctCount * perAnswerXp + drill.bonusXp,
            bonus: perfect ? t("prep.perfectBonusSuffix", { bonus: PERFECT_QUIZ_BONUS }) : "",
          })}
        </Text>
        {drill.correctCount * 2 < drill.questions.length && (
          <Text style={{ fontSize: font.size.small, color: colors.textFaint, textAlign: "center" }}>{t("prep.drillEncourage")}</Text>
        )}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {onRestart && (
            <TouchableOpacity
              onPress={onRestart}
              accessibilityRole="button"
              style={{ borderWidth: 1, borderColor: `${colors.accent}60`, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 }}
            >
              <Text style={{ color: colors.accentBright, fontWeight: "600", fontSize: font.size.body }}>{t("prep.drillAgain")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onExit}
            accessibilityRole="button"
            style={{ backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 }}
          >
            <Text style={{ color: colors.onAccent, fontWeight: "600", fontSize: font.size.body }}>{t("prep.backToCards")}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  const cur = drill.questions[drill.index];
  return (
    // Not keyed by question: QuizView animates each question in, the card itself enters once.
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSoft, boxShadow: shadow.card,
        borderRadius: 14,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BrandIcon name="drill" color={cur.color} size={13} />
          <Text style={{ fontSize: font.size.caption, fontWeight: "700", color: cur.color, letterSpacing: 0.8 }}>DRILL</Text>
          {tier && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: `${tier.color}1A`, borderWidth: 1, borderColor: `${tier.color}60` }}>
              <DifficultyIcon tier={tier} size={11} />
              <Text style={{ fontSize: font.size.tier, fontWeight: "700", color: tier.color, letterSpacing: 0.3 }}>{tier.label.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onExit}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Text style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("prep.exit")}</Text><BrandIcon name="close" color={colors.textFaint} size={11} /></View>
        </TouchableOpacity>
      </View>
      <QuizView
        tech={cur.tech}
        color={cur.color}
        question={cur.q}
        questionNumber={drill.index + 1}
        total={drill.questions.length}
        answered={drill.answered}
        xp={perAnswerXp + drill.lastBonus}
        timedFrom={isTimedTier(drill.difficulty) ? drill.shownAt : undefined}
        onAnswer={onAnswer}
        onNext={onNext}
        isLast={drill.index === drill.questions.length - 1}
        autoNextMs={autoNext && answeredCorrectly ? AUTO_NEXT_MS : undefined}
      />
    </Animated.View>
  );
}

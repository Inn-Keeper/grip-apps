import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CORRECT_XP, PERFECT_QUIZ_BONUS } from "@grip/core/gamification";
import { difficultyByKey } from "@grip/core/difficulty";
import { colors } from "@/theme";
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
};

type Props = {
  drill: Drill;
  onAnswer: (i: number) => void;
  onNext: () => void;
  onExit: () => void;
};

export function DrillSession({ drill, onAnswer, onNext, onExit }: Props) {
  const tier = difficultyByKey(drill.difficulty);
  const perAnswerXp = tier?.xp ?? CORRECT_XP;

  if (drill.done) {
    const perfect = drill.correctCount === drill.questions.length;
    return (
      <Animated.View
        entering={FadeInDown.springify()}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
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
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textBright }}>
          {drill.correctCount} / {drill.questions.length}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textDim, textAlign: "center" }}>
          +{drill.correctCount * perAnswerXp} XP{perfect ? ` · +${PERFECT_QUIZ_BONUS} perfect bonus` : ""}
        </Text>
        <TouchableOpacity
          onPress={onExit}
          style={{ backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9, marginTop: 8 }}
        >
          <Text style={{ color: colors.onAccent, fontWeight: "600", fontSize: 13 }}>Back to cards</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const cur = drill.questions[drill.index];
  return (
    <Animated.View
      key={drill.index}
      entering={FadeInDown.springify().damping(16)}
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: `${cur.color}40`,
        borderRadius: 14,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BrandIcon name="drill" color={cur.color} size={13} />
          <Text style={{ fontSize: 10, fontWeight: "700", color: cur.color, letterSpacing: 0.8 }}>DRILL</Text>
          {tier && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: `${tier.color}1A`, borderWidth: 1, borderColor: `${tier.color}60` }}>
              <DifficultyIcon tier={tier} size={11} />
              <Text style={{ fontSize: 9.5, fontWeight: "700", color: tier.color, letterSpacing: 0.3 }}>{tier.label.toUpperCase()}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onExit}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Text style={{ fontSize: 11, color: colors.textFaint }}>Exit</Text><BrandIcon name="close" color={colors.textFaint} size={11} /></View>
        </TouchableOpacity>
      </View>
      <QuizView
        tech={cur.tech}
        color={cur.color}
        question={cur.q}
        questionNumber={drill.index + 1}
        total={drill.questions.length}
        answered={drill.answered}
        onAnswer={onAnswer}
        onNext={onNext}
        isLast={drill.index === drill.questions.length - 1}
      />
    </Animated.View>
  );
}

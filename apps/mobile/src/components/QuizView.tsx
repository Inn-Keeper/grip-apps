import { useEffect } from "react";
import { AccessibilityInfo, Linking, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { techLinks } from "@grip/core/techLinks";
import { t } from "@grip/core/i18n";
import { colors } from "@/theme";
import { AnswerOption, type OptionState } from "./AnswerOption";
import { SpeedClock } from "./SpeedClock";

type Question = { question: string; options: string[]; correct: number };

type Props = {
  tech: string;
  color: string;
  question: Question;
  questionNumber: number;
  total: number;
  answered: number | null;
  // XP a correct answer earns at the current tier, plus any speed bonus once answered.
  xp: number;
  /** When the question appeared, on a timed (Thunderstorm) tier; shows the speed clock. */
  timedFrom?: number;
  onAnswer: (i: number) => void;
  onNext: () => void;
  isLast: boolean;
};

const letterFor = (i: number) => String.fromCharCode(65 + i);

function optionState(i: number, answered: number | null, correct: number): OptionState {
  if (answered === null) return "idle";
  if (i === correct) return "correct";
  return i === answered ? "wrong" : "dimmed";
}

export function QuizView({ tech, color, question, questionNumber, total, answered, xp, timedFrom, onAnswer, onNext, isLast }: Props) {
  const isCorrect = answered !== null && answered === question.correct;
  const link = techLinks[tech];
  const feedbackFor = (right: boolean) =>
    right ? t("prep.correct", { xp }) : t("prep.notQuite", { letter: letterFor(question.correct) });

  const choose = (i: number) => {
    const right = i === question.correct;
    // Fire-and-forget: haptics are a nicety and may be unavailable (simulator, web).
    Haptics.notificationAsync(
      right ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    ).catch(() => undefined);
    AccessibilityInfo.announceForAccessibility(feedbackFor(right));
    onAnswer(i);
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Text style={{ flexShrink: 1, fontSize: 10, fontWeight: "700", color, letterSpacing: 0.8 }}>
          {tech.toUpperCase()} · QUIZ
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {timedFrom !== undefined && answered === null && <SpeedClock key={questionNumber} shownAt={timedFrom} />}
          <Text style={{ fontSize: 10, color: colors.textFaint }}>
            {questionNumber} / {total}
          </Text>
        </View>
      </View>
      <ProgressSegments color={color} current={questionNumber} total={total} />

      {/* Keyed by question so each new question slides in. */}
      <Animated.View key={questionNumber} entering={FadeInRight.springify().damping(18)} style={{ gap: 10 }}>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text, fontWeight: "500" }}>{question.question}</Text>
        <View style={{ gap: 7 }}>
          {question.options.map((opt, i) => (
            <AnswerOption
              key={i}
              letter={letterFor(i)}
              text={opt}
              color={color}
              state={optionState(i, answered, question.correct)}
              onPress={() => choose(i)}
            />
          ))}
        </View>
      </Animated.View>

      {/* Fixed-height footer: a hint before answering, feedback + next step after — no layout jump. */}
      <View style={{ minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        {answered === null ? (
          <Text style={{ fontSize: 11.5, color: colors.textFaint }}>{t("prep.pickAnswer")}</Text>
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: isCorrect ? colors.success : colors.danger }}>
                  {feedbackFor(isCorrect)}
                </Text>
                {isCorrect && <XpFloat key={questionNumber} xp={xp} />}
              </View>
              {link && (
                <TouchableOpacity onPress={() => Linking.openURL(link)} accessibilityRole="link">
                  <Text style={{ fontSize: 12, color: colors.accentBright, fontWeight: "500" }}>{t("prep.docs")}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={onNext}
              accessibilityRole="button"
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                backgroundColor: `${color}25`,
                borderWidth: 1,
                borderColor: `${color}60`,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color }}>{isLast ? t("prep.finish") : t("common.next")}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// One segment per question: done, current (full color) and upcoming.
function ProgressSegments({ color, current, total }: { color: string; current: number; total: number }) {
  return (
    <View
      style={{ flexDirection: "row", gap: 4 }}
      accessible
      accessibilityLabel={t("prep.questionProgress", { n: current, total })}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i + 1 === current ? color : i + 1 < current ? `${color}80` : colors.well,
          }}
        />
      ))}
    </View>
  );
}

// "+XP" chip that drifts up and fades out once.
function XpFloat({ xp }: { xp: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 900 });
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: -18 * progress.value }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", right: -4, top: -14 }, style]}>
      <Text style={{ fontSize: 11, fontWeight: "800", color: colors.successBright }}>+{xp}</Text>
    </Animated.View>
  );
}

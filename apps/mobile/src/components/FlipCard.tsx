import { useEffect, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { CORRECT_XP, PERFECT_QUIZ_BONUS } from "@grip/core/gamification";
import { difficultyByKey } from "@grip/core/difficulty";
import { shuffle, shuffleOptions } from "@grip/core/quiz";
import { colors } from "@/theme";
import { t } from "@grip/core/i18n";
import { BrandIcon } from "@/components/BrandIcon";
import { DifficultyIcon } from "./DifficultyIcon";
import { QuizView } from "./QuizView";

type Item = {
  tech: string;
  oneliner: string;
  prep: string[];
  quiz: { question: string; options: string[]; correct: number }[];
  color: string;
};

type Stat = { correct: number; wrong: number } | undefined;

type Props = {
  item: Item;
  level: string;
  stat: Stat;
  record: (tech: string, isCorrect: boolean, source?: string, difficulty?: string | null) => void;
  addXp: (points: number) => void;
  // Loads tiered questions for this tech; returns shuffled questions or null to
  // fall back to the static prep questions.
  loadQuiz: (tech: string) => Promise<Item["quiz"] | null>;
  // Reports when this card's quiz opens/closes, so the screen can confirm tier changes.
  onQuizActiveChange?: (active: boolean) => void;
  /** A clean run: the screen celebrates it. */
  onPerfect?: () => void;
};

const SPRING = { damping: 16, stiffness: 140 };
const PRESS_SPRING = { damping: 18, stiffness: 320 };
// Long enough to read the run summary, short enough not to feel like waiting.
const RESULT_MS = 1700;

// 3D card flip on the UI thread: front face 0→180°, back face -180→0.
export function FlipCard({ item, level, stat, record, addXp, loadQuiz, onQuizActiveChange, onPerfect }: Props) {
  const rotation = useSharedValue(0);
  const press = useSharedValue(1);
  const [phase, setPhase] = useState<"front" | "back" | "quiz" | "result">("front");
  const [result, setResult] = useState<{ correct: number; total: number; xp: number } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<{ questions: Item["quiz"]; index: number; answered: number | null; runCorrect: number } | null>(null);

  // Signal active while the quiz is open; the cleanup also fires on unmount (e.g. tier remount).
  useEffect(() => {
    if (phase !== "quiz") return;
    onQuizActiveChange?.(true);
    return () => onQuizActiveChange?.(false);
  }, [phase, onQuizActiveChange]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }, { scale: press.value }],
    backfaceVisibility: "hidden" as const,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value - 180}deg` }],
    backfaceVisibility: "hidden" as const,
    opacity: interpolate(rotation.value, [89, 91], [0, 1]),
  }));

  const flipToBack = () => {
    rotation.value = withSpring(180, SPRING);
    setPhase("back");
  };

  const flipToFront = () => {
    rotation.value = withSpring(0, SPRING);
    setPhase("front");
    setQuiz(null);
  };

  const startQuiz = async () => {
    if (quizLoading) return;
    setQuizLoading(true);
    const fetched = await loadQuiz(item.tech);
    const questions = fetched ?? shuffle(item.quiz).map(shuffleOptions);
    setQuiz({ questions, index: 0, answered: null, runCorrect: 0 });
    setPhase("quiz");
    setQuizLoading(false);
  };

  const answer = (i: number) => {
    if (!quiz || quiz.answered !== null) return;
    const isCorrect = i === quiz.questions[quiz.index].correct;
    setQuiz({ ...quiz, answered: i, runCorrect: quiz.runCorrect + (isCorrect ? 1 : 0) });
    record(item.tech, isCorrect, "card", level);
  };

  const next = () => {
    if (!quiz) return;
    const nextIndex = quiz.index + 1;
    if (nextIndex >= quiz.questions.length) {
      const total = quiz.questions.length;
      const perfect = quiz.runCorrect === total;
      if (perfect) {
        addXp(PERFECT_QUIZ_BONUS);
        onPerfect?.();
      }
      // Show what the run earned before flipping back, so finishing a card lands.
      setResult({
        correct: quiz.runCorrect,
        total,
        xp: quiz.runCorrect * (tier?.xp ?? CORRECT_XP) + (perfect ? PERFECT_QUIZ_BONUS : 0),
      });
      setPhase("result");
      setQuiz(null);
      setTimeout(() => {
        setResult(null);
        flipToFront();
      }, RESULT_MS);
    } else {
      setQuiz({ ...quiz, index: nextIndex, answered: null });
    }
  };

  const attempts = stat ? stat.correct + stat.wrong : 0;
  const accuracy = attempts ? Math.round(((stat?.correct ?? 0) / attempts) * 100) : null;
  const tier = difficultyByKey(level);

  if (phase === "result" && result) {
    const perfect = result.correct === result.total;
    const tone = perfect ? colors.success : result.correct * 2 >= result.total ? item.color : colors.warning;
    return (
      <Animated.View
        entering={FadeIn.duration(160)}
        accessibilityRole="summary"
        style={{
          minHeight: 185,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: `${tone}60`,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: 16,
        }}
      >
        <BrandIcon name={perfect ? "rank" : "spark"} color={tone} size={24} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textBright }}>
          {t("prep.cardResult", { correct: result.correct, total: result.total, xp: result.xp })}
        </Text>
        <Text style={{ fontSize: 11.5, color: colors.textFaint }}>{item.tech}</Text>
      </Animated.View>
    );
  }

  if (phase === "quiz" && quiz) {
    return (
      <Animated.View
        entering={FadeIn.duration(160)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: `${item.color}40`,
          borderRadius: 14,
          padding: 16,
        }}
      >
        <QuizView
          tech={item.tech}
          color={item.color}
          question={quiz.questions[quiz.index]}
          questionNumber={quiz.index + 1}
          total={quiz.questions.length}
          answered={quiz.answered}
          xp={tier?.xp ?? CORRECT_XP}
          onAnswer={answer}
          onNext={next}
          isLast={quiz.index === quiz.questions.length - 1}
        />
      </Animated.View>
    );
  }

  return (
    <View style={{ minHeight: 185 }}>
      {/* Front */}
      <Animated.View style={[{ borderRadius: 14 }, frontStyle, phase !== "front" && { position: "absolute", inset: 0 }]}>
        <Pressable
          onPress={flipToBack}
          onPressIn={() => (press.value = withSpring(0.98, PRESS_SPRING))}
          onPressOut={() => (press.value = withSpring(1, PRESS_SPRING))}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: `${item.color}30`,
            borderRadius: 14,
            padding: 18,
            minHeight: 185,
            justifyContent: "space-between",
          }}
        >
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  backgroundColor: `${item.color}20`,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: item.color, fontSize: 11, fontWeight: "700", letterSpacing: 0.4 }}>
                  {item.tech}
                </Text>
              </View>
              {tier && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: `${tier.color}1A`, borderWidth: 1, borderColor: `${tier.color}55` }}>
                  <DifficultyIcon tier={tier} size={11} />
                  <Text style={{ fontSize: 9.5, fontWeight: "800", color: tier.color }}>{tier.label}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 14, lineHeight: 21, color: colors.text }}>{item.oneliner}</Text>
          </View>
          {accuracy !== null && (
            // A bar reads at a glance; the number stays for the exact value.
            <View style={{ height: 3, backgroundColor: colors.well, borderRadius: 2, overflow: "hidden", marginTop: 12 }}>
              <View style={{ width: `${accuracy}%`, height: "100%", backgroundColor: accuracy >= 70 ? colors.success : colors.warning }} />
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: accuracy !== null && accuracy >= 70 ? colors.success : colors.warning }}>
              {accuracy === null ? "" : t("prep.accuracyStat", { pct: accuracy, count: attempts })}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: item.color }}>{t("prep.prepNotes")}</Text>
              <BrandIcon name="arrowRight" color={item.color} size={11} />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Back */}
      {phase === "back" && (
        <Animated.View style={[{ borderRadius: 14 }, backStyle]}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: `${item.color}50`,
              borderRadius: 14,
              padding: 16,
              minHeight: 185,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: item.color, letterSpacing: 0.6 }}>
              INTERVIEW PREP
            </Text>
            <View style={{ gap: 6 }}>
              {item.prep.map((point) => (
                <Text key={point} style={{ fontSize: 12.5, lineHeight: 18, color: colors.textDim }}>
                  {"•"} {point}
                </Text>
              ))}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: "auto" }}>
              <TouchableOpacity onPress={flipToFront} style={{ padding: 8 }}>
                <Text style={{ fontSize: 12, color: colors.textFaint }}>← flip back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startQuiz}
                disabled={quizLoading}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: `${item.color}25`,
                  borderWidth: 1,
                  borderColor: `${item.color}60`,
                  borderRadius: 8,
                  opacity: quizLoading ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: item.color }}>{quizLoading ? "Loading…" : "Take quiz →"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

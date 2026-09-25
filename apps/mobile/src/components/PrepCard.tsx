import { useEffect, useState } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { CORRECT_XP, PERFECT_QUIZ_BONUS } from "@grip/core/gamification";
import { difficultyByKey, isTimedTier, speedBonusXp } from "@grip/core/difficulty";
import { shuffle, shuffleOptions } from "@grip/core/quiz";
import { colors, font, shadow } from "@/theme";
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

const PRESS_SPRING = { damping: 18, stiffness: 320 };
// Long enough to read the run summary, short enough not to feel like waiting.
const RESULT_MS = 1700;

// A study card, as on web: what the tech is, its interview notes and its quiz on one face.
// Tapping the card starts the quiz in place; the run summary shows, then the card returns.
export function PrepCard({ item, level, stat, record, addXp, loadQuiz, onQuizActiveChange, onPerfect }: Props) {
  const press = useSharedValue(1);
  const [phase, setPhase] = useState<"card" | "quiz" | "result">("card");
  const [result, setResult] = useState<{ correct: number; total: number; xp: number } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  // shownAt, lastBonus and bonusXp drive the Thunderstorm speed bonus, as in drills.
  const [quiz, setQuiz] = useState<{ questions: Item["quiz"]; index: number; answered: number | null; runCorrect: number; shownAt: number; lastBonus: number; bonusXp: number } | null>(null);

  // Signal active while the quiz is open; the cleanup also fires on unmount (e.g. tier remount).
  useEffect(() => {
    if (phase !== "quiz") return;
    onQuizActiveChange?.(true);
    return () => onQuizActiveChange?.(false);
  }, [phase, onQuizActiveChange]);

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  const backToCard = () => {
    setPhase("card");
    setQuiz(null);
  };

  const startQuiz = async () => {
    if (quizLoading) return;
    setQuizLoading(true);
    const fetched = await loadQuiz(item.tech);
    const questions = fetched ?? shuffle(item.quiz).map(shuffleOptions);
    setQuiz({ questions, index: 0, answered: null, runCorrect: 0, shownAt: Date.now(), lastBonus: 0, bonusXp: 0 });
    setPhase("quiz");
    setQuizLoading(false);
  };

  const answer = (i: number) => {
    if (!quiz || quiz.answered !== null) return;
    const isCorrect = i === quiz.questions[quiz.index].correct;
    const bonus = isCorrect ? speedBonusXp(level, Date.now() - quiz.shownAt) : 0;
    setQuiz({ ...quiz, answered: i, runCorrect: quiz.runCorrect + (isCorrect ? 1 : 0), lastBonus: bonus, bonusXp: quiz.bonusXp + bonus });
    record(item.tech, isCorrect, "card", level);
    if (bonus) addXp(bonus);
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
        xp: quiz.runCorrect * (tier?.xp ?? CORRECT_XP) + quiz.bonusXp + (perfect ? PERFECT_QUIZ_BONUS : 0),
      });
      setPhase("result");
      setQuiz(null);
      setTimeout(() => {
        setResult(null);
        backToCard();
      }, RESULT_MS);
    } else {
      setQuiz({ ...quiz, index: nextIndex, answered: null, shownAt: Date.now(), lastBonus: 0 });
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
          borderColor: colors.borderSoft, boxShadow: shadow.card,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: 16,
        }}
      >
        <BrandIcon name={perfect ? "rank" : "spark"} color={tone} size={24} />
        <Text style={{ fontSize: font.size.titleLg, fontWeight: "800", color: colors.textBright }}>
          {t("prep.cardResult", { correct: result.correct, total: result.total, xp: result.xp })}
        </Text>
        <Text style={{ fontSize: font.size.labelLg, color: colors.textFaint }}>{item.tech}</Text>
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
          borderColor: colors.borderSoft, boxShadow: shadow.card,
          borderRadius: 14,
          padding: 16,
          gap: 10,
        }}
      >
        {/* Same header as a drill: what kind of run this is, and a way out before the end. */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {tier ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: `${tier.color}1A`, borderWidth: 1, borderColor: `${tier.color}60` }}>
              <DifficultyIcon tier={tier} size={11} />
              <Text style={{ fontSize: font.size.tier, fontWeight: "700", color: tier.color, letterSpacing: 0.3 }}>{tier.label.toUpperCase()}</Text>
            </View>
          ) : <View />}
          <TouchableOpacity onPress={backToCard} accessibilityRole="button" hitSlop={10}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("prep.exit")}</Text>
              <BrandIcon name="close" color={colors.textFaint} size={11} />
            </View>
          </TouchableOpacity>
        </View>
        <QuizView
          tech={item.tech}
          color={item.color}
          question={quiz.questions[quiz.index]}
          questionNumber={quiz.index + 1}
          total={quiz.questions.length}
          answered={quiz.answered}
          xp={(tier?.xp ?? CORRECT_XP) + quiz.lastBonus}
          timedFrom={isTimedTier(level) ? quiz.shownAt : undefined}
          onAnswer={answer}
          onNext={next}
          isLast={quiz.index === quiz.questions.length - 1}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ borderRadius: 14 }, pressStyle]}>
      <Pressable
        onPress={startQuiz}
        disabled={quizLoading}
        onPressIn={() => (press.value = withSpring(0.98, PRESS_SPRING))}
        onPressOut={() => (press.value = withSpring(1, PRESS_SPRING))}
        accessibilityRole="button"
        accessibilityLabel={`${item.tech}. ${t("prep.takeQuiz")}`}
        accessibilityState={{ busy: quizLoading }}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSoft, boxShadow: shadow.card,
          borderRadius: 14,
          padding: 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 3, backgroundColor: `${item.color}20`, borderRadius: 20 }}>
            <Text style={{ color: item.color, fontSize: font.size.label, fontWeight: "700", letterSpacing: 0.4 }}>{item.tech}</Text>
          </View>
          {tier && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: `${tier.color}1A`, borderWidth: 1, borderColor: `${tier.color}55` }}>
              <DifficultyIcon tier={tier} size={11} />
              <Text style={{ fontSize: font.size.tier, fontWeight: "800", color: tier.color }}>{tier.label}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: font.size.bodyMd, lineHeight: 21, color: colors.text }}>{item.oneliner}</Text>
        {/* Quiet reference text: smaller and dimmer than the one-liner, as on web. */}
        <View style={{ gap: 4, marginTop: 10 }}>
          {item.prep.map((point) => (
            <Text key={point} style={{ fontSize: font.size.small, lineHeight: 17, color: `${colors.textDim}CC` }}>
              {"•"} {point}
            </Text>
          ))}
        </View>
        {accuracy !== null && (
          // A bar reads at a glance; the number stays for the exact value.
          <View style={{ height: 3, backgroundColor: colors.well, borderRadius: 2, overflow: "hidden", marginTop: 12 }}>
            <View style={{ width: `${accuracy}%`, height: "100%", backgroundColor: accuracy >= 70 ? colors.success : colors.warning }} />
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
          <Text style={{ fontSize: font.size.label, color: accuracy !== null && accuracy >= 70 ? colors.success : colors.warning }}>
            {accuracy === null ? "" : t("prep.accuracyStat", { pct: accuracy, count: attempts })}
          </Text>
          <View style={{ paddingHorizontal: 14, paddingVertical: 7, backgroundColor: `${item.color}25`, borderWidth: 1, borderColor: `${item.color}60`, borderRadius: 8, opacity: quizLoading ? 0.6 : 1 }}>
            <Text style={{ fontSize: font.size.small, fontWeight: "700", color: item.color }}>{quizLoading ? t("common.loading") : t("prep.takeQuiz")}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

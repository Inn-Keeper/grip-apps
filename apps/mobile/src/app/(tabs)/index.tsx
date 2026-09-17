import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { categories } from "@grip/core/prepData";
import { buildGithubTechCategory, githubUsernameFromUrl } from "@grip/core/githubTechs";
import { mergeTechSignals } from "@grip/core/cvTechs";
import { recentStruggledTechs } from "@grip/core/contacts";
import { PERFECT_QUIZ_BONUS, rankForXp } from "@grip/core/gamification";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import type { NextUpKind } from "@grip/core/nextUp";
import { useLocale } from "@/lib/useLocale";
import { DEFAULT_QUIZ_SIZE } from "@grip/core/quizPrefs";
import { buildDrillFromQuestions, selectCategoryDrillTechs, selectDrillTechs } from "@grip/core/quiz";
import { getQuizSize, setQuizSize } from "@/lib/quizPrefs";
import { useScores } from "@/lib/useScores";
import { setPrepPlan, usePrepPlan } from "@/lib/uiStore";
import { colors, layout } from "@/theme";
import { FlipCard } from "@/components/FlipCard";
import { StatsBar } from "@/components/StatsBar";
import { NextUpCard } from "@/components/NextUpCard";
import { PrepSettings } from "@/components/PrepSettings";
import { DrillSession, type Drill } from "@/components/DrillSession";
import { AccuracyChart } from "@/components/AccuracyChart";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { Screen, ScreenHeader, SegmentedPills } from "@/components/ui";
import { categoryIconName } from "@/components/BrandIcon";
import {
  useAccuracyTimelineQuery,
  useGithubTechsQuery,
  usePrepContactsQuery,
  usePrepProfileQuery,
  usePrepQuestionFetchers,
  useReviewQueueQuery,
} from "@/queries/prep";

type Celebration = { title: string; subtitle: string; accent?: string };
type PrepItem = {
  tech: string;
  oneliner: string;
  prep: string[];
  quiz: { question: string; options: string[]; correct: number }[];
  color?: string;
};
type PrepCategory = { name: string; emoji?: string; color: string; items: PrepItem[] };

const DRILL_SIZE = 10;

// Map every tech to its category color, so a fetched question can be themed.
const colorByTech: Record<string, string> = Object.fromEntries(
  categories.flatMap((c: { color: string; items: { tech: string }[] }) =>
    c.items.map((item) => [item.tech, c.color])
  )
);
const allTechs: string[] = Object.keys(colorByTech);

export default function PrepScreen() {
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  // Track the selected category by name, not list index: the "From GitHub techs"
  // category is prepended once it loads, which would shift every index underneath it.
  const [activeCategoryName, setActiveCategoryName] = useState<string>(categories[0].name);
  const [drill, setDrill] = useState<Drill | null>(null);
  // Global difficulty — drives both the quiz cards and the drill.
  const [level, setLevel] = useState("mid");
  const [openQuizCount, setOpenQuizCount] = useState(0);
  const [quizSize, setQuizSizeState] = useState<number | null>(DEFAULT_QUIZ_SIZE);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const previousRank = useRef<ReturnType<typeof rankForXp> | null>(null);
  // What "Drill again" repeats: the same techs and tier as the drill just finished.
  const lastDrillRef = useRef<{ difficulty: string; techs: string[]; fallbackToAll: boolean } | null>(null);
  const { scores, record, addXp } = useScores();
  const { data: accuracy = [] } = useAccuracyTimelineQuery();
  const { data: reviewQueue = [] } = useReviewQueueQuery();
  const { data: prepContacts = [] } = usePrepContactsQuery();
  const prepPlan = usePrepPlan();
  const attempts = Object.values(scores.answers).reduce((sum, s) => sum + s.correct + s.wrong, 0);
  const reviewDueTechs = reviewQueue.filter((entry) => entry.due).map((entry) => entry.tech);
  const struggleBoost = recentStruggledTechs(prepContacts);
  const { data: profile = null } = usePrepProfileQuery();
  const githubPrepEnabled = !!profile?.useGithubTechsForPrep;
  const githubUsername = githubPrepEnabled ? githubUsernameFromUrl(profile?.githubUrl) : "";
  const { data: githubTechs = [] } = useGithubTechsQuery(githubUsername, allTechs, githubPrepEnabled && !!githubUsername);
  const { fetchTierQuestions, loadCardQuiz } = usePrepQuestionFetchers(level, quizSize, setPoolSize);

  useEffect(() => {
    getQuizSize().then(setQuizSizeState).catch(() => setQuizSizeState(DEFAULT_QUIZ_SIZE));
  }, []);

  const updateQuizSize = (value: number | null) => {
    setQuizSizeState(value);
    setQuizSize(value).catch(() => undefined);
  };

  const allItems = categories.flatMap((c: { name: string; color: string; emoji: string; items: { tech: string }[] }) =>
    c.items.map((item) => ({ ...item, category: c.name, color: c.color, emoji: c.emoji }))
  );
  // CV techs (string[], saved on the profile) join GitHub signals into one
  // "from your profile" category — merge/dedupe logic lives in core.
  const cvTechs = profile?.cvTechs ?? [];
  const combinedSignals = mergeTechSignals(githubTechs, cvTechs);

  const techCategoryLabel =
    cvTechs.length && githubTechs.length
      ? t("prep.profileTechsCategory")
      : cvTechs.length
        ? t("prep.cvTechsCategory")
        : undefined;
  const githubCategory = buildGithubTechCategory(allItems, combinedSignals, {
    color: colors.accentBright,
    name: techCategoryLabel,
  });
  const displayCategories = githubCategory ? [githubCategory, ...categories] : categories;
  const category = (displayCategories.find((c: { name: string }) => c.name === activeCategoryName) ?? displayCategories[0]) as PrepCategory;

  useEffect(() => {
    const current = rankForXp(scores.xp);
    if (previousRank.current && current.min > previousRank.current.min) {
      setCelebration({
        title: t("celebration.rankTitle", { rank: t(`enum.rank.${current.name}` as Parameters<typeof t>[0]) }),
        subtitle: t("celebration.rankSubtitle", { xp: scores.xp }),
        accent: colors.accent,
      });
    }
    previousRank.current = current;
  }, [scores.xp]);

  // Fetches questions for the given techs and opens the drill UI.
  // `fallbackToAll` widens an empty pool to every tech — wanted for the generic
  // weakest-drill, wrong for targeted drills (review queue, prep plan).
  const runDrill = async (difficulty: string, techs: string[], { fallbackToAll = false } = {}) => {
    lastDrillRef.current = { difficulty, techs, fallbackToAll };
    setDrillLoading(true);
    setDrillError(null);
    try {
      let questions = await fetchTierQuestions(difficulty, techs);
      if (questions.length === 0 && fallbackToAll) questions = await fetchTierQuestions(difficulty, allTechs);
      if (questions.length === 0) {
        setDrillError(`No ${difficultyByKey(difficulty)?.label ?? difficulty} questions yet — more land soon.`);
        return;
      }
      setDrill({
        questions: buildDrillFromQuestions(questions, { colorByTech, fallbackColor: colors.accent, size: DRILL_SIZE }),
        index: 0,
        answered: null,
        correctCount: 0,
        done: false,
        difficulty,
      });
    } catch {
      setDrillError("Couldn't load questions. Check your connection and retry.");
    } finally {
      setDrillLoading(false);
    }
  };

  const startDrill = (difficulty: string) =>
    runDrill(
      difficulty,
      selectDrillTechs(displayCategories, scores.answers, { techCount: 5, boost: struggleBoost }),
      { fallbackToAll: true }
    );

  const startReviewDrill = () => runDrill(level, reviewDueTechs);

  const startPlanDrill = () => prepPlan && runDrill(level, prepPlan.techs);

  const startNextUp = (kind: NextUpKind) => {
    if (kind === "review") startReviewDrill();
    else if (kind === "plan") startPlanDrill();
    else startDrill(level);
  };

  const startCategoryDrill = async () => {
    setDrillLoading(true);
    setDrillError(null);
    try {
      const techs = selectCategoryDrillTechs(category.items, scores.answers, { techCount: category.items.length });
      // "Drill again" repeats this category, not the last weakest-drill.
      lastDrillRef.current = { difficulty: level, techs, fallbackToAll: true };
      let questions = await fetchTierQuestions(level, techs);
      if (questions.length === 0) questions = await fetchTierQuestions(level, allTechs);
      if (questions.length === 0) {
        setDrillError(`No ${difficultyByKey(level)?.label ?? level} questions yet — more land soon.`);
        return;
      }
      setDrill({
        questions: buildDrillFromQuestions(questions, { colorByTech, fallbackColor: colors.accent, size: DRILL_SIZE }),
        index: 0,
        answered: null,
        correctCount: 0,
        done: false,
        difficulty: level,
      });
    } catch {
      setDrillError("Couldn't load questions. Check your connection and retry.");
    } finally {
      setDrillLoading(false);
    }
  };

  // FlipCards report when their quiz opens/closes so we know whether to confirm.
  const setQuizActive = useCallback((active: boolean) => {
    setOpenQuizCount((c) => Math.max(0, c + (active ? 1 : -1)));
  }, []);

  // Switch tier instantly, but confirm first if a quiz is mid-flight (would be discarded).
  const requestLevel = (key: string) => {
    if (key === level) return;
    if (openQuizCount > 0) {
      Alert.alert(
        "Switch difficulty?",
        `You have a quiz in progress. Switching to ${difficultyByKey(key)?.label ?? key} resets your open card${openQuizCount > 1 ? "s" : ""}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Switch & reload", style: "destructive", onPress: () => setLevel(key) },
        ]
      );
    } else {
      setLevel(key);
    }
  };

  const answerDrill = (i: number) => {
    if (!drill || drill.answered !== null) return;
    const isCorrect = i === drill.questions[drill.index].q.correct;
    setDrill({ ...drill, answered: i, correctCount: drill.correctCount + (isCorrect ? 1 : 0) });
    record(drill.questions[drill.index].tech, isCorrect, "drill", drill.difficulty);
  };

  const nextDrill = () => {
    if (!drill) return;
    const nextIndex = drill.index + 1;
    if (nextIndex >= drill.questions.length) {
      if (drill.correctCount === drill.questions.length) {
        addXp(PERFECT_QUIZ_BONUS);
        setCelebration({
          title: t("celebration.perfectTitle"),
          subtitle: t("celebration.perfectSubtitle", { bonus: PERFECT_QUIZ_BONUS }),
          accent: colors.success,
        });
      }
      setDrill({ ...drill, done: true });
    } else {
      setDrill({ ...drill, index: nextIndex, answered: null });
    }
  };

  return (
    <Screen key={locale}>
      {!drill && (
        <ScreenHeader title={t("tabs.prep")} subtitle={t("screen.prepSubtitle")}>
          <SegmentedPills
            options={displayCategories.map((cat: { name: string; color: string }) => ({
              key: cat.name,
              label: cat.name,
              icon: categoryIconName(cat.name),
              color: cat.color,
            }))}
            activeKey={activeCategoryName}
            onChange={(key) => setActiveCategoryName(String(key))}
          />
        </ScreenHeader>
      )}
      <FlatList
        data={drill ? [] : category.items.map((item: PrepItem) => ({ ...item, color: item.color ?? category.color }))}
        // Including level remounts cards on a tier change, resetting any open quiz to the new tier.
        keyExtractor={(item) => `${activeCategoryName}-${level}-${item.tech}`}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + layout.tabBarClearance }}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            {!drill && (
              <NextUpCard
                reviewDueCount={reviewDueTechs.length}
                plan={prepPlan}
                attempts={attempts}
                busy={drillLoading}
                onStart={startNextUp}
                onDismissPlan={() => setPrepPlan(null)}
              />
            )}
            <StatsBar scores={scores} />
            {!drill && (
              <TouchableOpacity
                onPress={startCategoryDrill}
                disabled={drillLoading}
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: `${category.color}60`,
                  opacity: drillLoading ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: category.color }}>
                  Drill {category.name}
                </Text>
              </TouchableOpacity>
            )}
            {!drill && (
              <PrepSettings level={level} onLevel={requestLevel} quizSize={quizSize} poolSize={poolSize} onQuizSize={updateQuizSize} />
            )}
            {drillError && !drill && (
              <Text style={{ fontSize: 11, color: colors.warning, paddingHorizontal: 2 }}>{drillError}</Text>
            )}

            {drill && (
              <DrillSession
                drill={drill}
                onAnswer={answerDrill}
                onNext={nextDrill}
                onExit={() => setDrill(null)}
                onRestart={() => {
                  const last = lastDrillRef.current;
                  if (last) runDrill(last.difficulty, last.techs, { fallbackToAll: last.fallbackToAll });
                }}
              />
            )}
          </View>
        }
        // Progress history sits below the cards so the cards stay near the top.
        ListFooterComponent={drill ? null : <AccuracyChart points={accuracy} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 360)).springify().damping(18)}>
            <FlipCard
              item={item}
              level={level}
              stat={scores.answers[item.tech]}
              record={record}
              addXp={addXp}
              loadQuiz={loadCardQuiz}
              onQuizActiveChange={setQuizActive}
              onPerfect={() =>
                setCelebration({
                  title: t("celebration.perfectCardTitle"),
                  subtitle: t("celebration.perfectSubtitle", { bonus: PERFECT_QUIZ_BONUS }),
                  accent: colors.success,
                })
              }
            />
          </Animated.View>
        )}
      />
      {celebration && (
        <CelebrationOverlay
          title={celebration.title}
          subtitle={celebration.subtitle}
          accent={celebration.accent}
          onDone={() => setCelebration(null)}
        />
      )}
    </Screen>
  );
}

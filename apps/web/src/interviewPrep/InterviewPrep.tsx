import { useEffect, useRef, useState } from "react";
import { categories } from "@grip-apps/core/prepData";
import { techLinks } from "@grip-apps/core/techLinks";
import { buildGithubTechCategory, githubUsernameFromUrl } from "@grip-apps/core/githubTechs";
import { mergeTechSignals } from "@grip-apps/core/cvTechs";
import { recentStruggledTechs } from "@grip-apps/core/contacts";
import { PERFECT_QUIZ_BONUS, rankForXp } from "@grip-apps/core/gamification";
import { buildDrillFromQuestions, selectCategoryDrillTechs, selectDrillTechs, shuffle, shuffleOptions } from "@grip-apps/core/quiz";
import { difficultyByKey } from "@grip-apps/core/difficulty";
import { t } from "@grip-apps/core/i18n";
import { useScores } from "./useScores";
import { CelebrationOverlay } from "../components/CelebrationOverlay";
import { colors } from "@grip-apps/core/tokens";
import { WorkspaceLayout, WorkspacePanel } from "../components/WorkspaceLayout";
import { PoeAssistant } from "../components/poe/PoeAssistant";
import { getQuizSize, setQuizSize } from "./quizPrefs";
import styles from "./InterviewPrep.module.css";
import type {
  CardState,
  CelebrationState,
  DrillState,
  PoeCue,
  PrepItem,
  QuizQuestion,
} from "./types";
import { Card } from "./Card";
import { ConfirmDialog } from "./ConfirmDialog";
import { DrillSession } from "./DrillSession";
import { MockLoop } from "./MockLoop";
import { PrepLeftRail } from "./PrepLeftRail";
import { PrepRightRail } from "./PrepRightRail";
import {
  useAccuracyTimelineQuery,
  useGithubTechsQuery,
  usePrepContactsQuery,
  usePrepProfileQuery,
  usePrepQuestionFetchers,
  useReviewQueueQuery,
} from "./queries";
import { clearPrepPlan, readPrepPlan, type StoredPrepPlan } from "../lib/prepPlanHandoff";
import { summarizeScores } from "./summarizeScores";

const DRILL_SIZE = 10;

// Map every tech to its category color so a fetched question can be themed.
const colorByTech = Object.fromEntries(
  categories.flatMap((c) => c.items.map((item) => [item.tech, c.color]))
);
const allTechs = Object.keys(colorByTech);

export default function InterviewPrep() {
  // Track the selected category by name, not list index: the "From GitHub techs"
  // category is prepended once it loads, which would shift every index underneath it.
  const [activeCategoryName, setActiveCategoryName] = useState(categories[0]?.name ?? "");
  const [cardState, setCardState] = useState<Record<string, CardState>>({});
  const [search, setSearch] = useState("");
  const [drill, setDrill] = useState<DrillState | null>(null);
  // Global difficulty, chosen in the right rail — drives both the quiz cards and drills.
  const [level, setLevel] = useState("mid");
  const [pendingLevel, setPendingLevel] = useState<string | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [poeCue, setPoeCue] = useState<PoeCue | null>(null);
  // A drill can run standalone or as round 1 of a mock loop.
  const [mockActive, setMockActive] = useState(false);
  // Prep plan handed over from a Quest contact ("Drill these in Prep").
  const [prepPlan, setPrepPlan] = useState<StoredPrepPlan | null>(() => readPrepPlan());
  // null = use all available questions; number = capped at that value
  const [quizSize, setQuizSizeState] = useState<number | null>(() => getQuizSize());
  // tracks the DB pool size for the most-recently-fetched tech+level combo
  const [poolSize, setPoolSize] = useState<number | null>(null);

  const updateQuizSize = (value: number | null) => {
    setQuizSize(value);
    setQuizSizeState(value);
    setCardState({});
  };
  const previousRank = useRef<{ name: string; min: number } | null>(null);
  const { scores, scoresReady, record, addXp } = useScores();
  const { data: accuracy = [] } = useAccuracyTimelineQuery();
  const { data: reviewQueue = [] } = useReviewQueueQuery();
  const { data: prepContacts = [] } = usePrepContactsQuery();
  const { data: profile = null } = usePrepProfileQuery();
  const reviewDueTechs = reviewQueue.filter((entry) => entry.due).map((entry) => entry.tech);
  const struggleBoost = recentStruggledTechs(prepContacts);
  const githubPrepEnabled = !!profile?.useGithubTechsForPrep;
  const githubUsername = githubPrepEnabled ? githubUsernameFromUrl(profile?.githubUrl) : "";
  const { data: githubTechs = [], error: githubError, isFetching: githubLoading } =
    useGithubTechsQuery(githubUsername, allTechs, githubPrepEnabled && !!githubUsername);
  const { fetchTierQuestions, fetchCardQuestions } = usePrepQuestionFetchers(level, quizSize, setPoolSize);

  useEffect(() => {
    if (!scoresReady) return;
    const current = rankForXp(scores.xp);
    if (previousRank.current && current && current.min > previousRank.current.min) {
      setCelebration({
        title: t("celebration.rankTitle", { rank: t(`enum.rank.${current.name}` as Parameters<typeof t>[0]) }),
        subtitle: t("celebration.rankSubtitle", { xp: scores.xp }),
        accent: colors.accent ?? "",
      });
      setPoeCue({ type: "levelUp", id: Date.now() });
    }
    previousRank.current = current ?? null;
  }, [scores.xp, scoresReady]);

  const allItems = categories.flatMap((c) =>
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
        : undefined; // undefined -> keep the GitHub default in core
  const githubCategory = buildGithubTechCategory(allItems, combinedSignals, {
    color: colors.accentBright,
    name: techCategoryLabel,
  });
  const displayCategories = githubCategory ? [githubCategory, ...categories] : categories;

  const filtered = search.trim()
    ? allItems.filter(
        (i) =>
          i.tech.toLowerCase().includes(search.toLowerCase()) ||
          i.oneliner.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const displayCategory = displayCategories.find((c) => c.name === activeCategoryName) ?? displayCategories[0]!;
  const summary = summarizeScores(scores);
  const visibleItems: PrepItem[] = filtered ?? (displayCategory.items as PrepItem[]).map((item: PrepItem) => ({ ...item, color: item.color ?? displayCategory.color, emoji: displayCategory.emoji }));
  const activeTitle = filtered ? t("prep.searchResults") : displayCategory.name;

  const getState = (key: string): CardState =>
    cardState[key] ?? { phase: "front", quizIndex: 0, answered: null, runCorrect: 0, shuffled: null };

  const handleFlip = async (key: string, item: PrepItem) => {
    const s = cardState[key] ?? { phase: "front" as const };
    if (s.phase === "front") {
      setCardState((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), phase: "back" as const, quizIndex: 0, answered: null, runCorrect: 0, shuffled: null } }));
      return;
    }
    if (s.phase === "back") {
      const fetched = await fetchCardQuestions(item.tech);
      const shuffled = fetched ?? (shuffle(item.quiz) as QuizQuestion[]).map(shuffleOptions as (q: QuizQuestion) => QuizQuestion);
      setCardState((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? {}), phase: "quiz" as const, quizIndex: 0, answered: null, runCorrect: 0, shuffled },
      }));
    }
  };

  const handleAnswer = (key: string, tech: string, optionIndex: number) => {
    const s = cardState[key];
    if (!s || s.answered !== null) return;
    const isCorrect = optionIndex === s.shuffled![s.quizIndex]!.correct;
    setCardState((prev) => ({
      ...prev,
      [key]: { ...s, answered: optionIndex, runCorrect: s.runCorrect + (isCorrect ? 1 : 0) },
    }));
    setPoeCue({ type: isCorrect ? "correct" : "wrong", id: Date.now() });
    record(tech, isCorrect, "card", level);
  };

  const handleNextQuestion = (key: string) => {
    const s = cardState[key];
    if (!s || !s.shuffled) return;
    const nextIndex = s.quizIndex + 1;
    if (nextIndex >= s.shuffled.length) {
      if (s.runCorrect === s.shuffled.length) addXp(PERFECT_QUIZ_BONUS);
      setCardState((prev) => ({
        ...prev,
        [key]: { ...s, phase: "front" as const, quizIndex: 0, answered: null, runCorrect: 0, shuffled: null },
      }));
    } else {
      setCardState((prev) => ({ ...prev, [key]: { ...s, quizIndex: nextIndex, answered: null } }));
    }
  };

  const handleFlipBack = (key: string) => {
    setCardState((prev) => {
      const s = prev[key];
      if (!s) return prev;
      return { ...prev, [key]: { ...s, phase: "front" as const } };
    });
  };

  // Fetches questions for the given techs and opens the drill UI.
  // `fallbackToAll` widens an empty pool to every tech — wanted for the generic
  // weakest-drill, wrong for targeted drills (review queue, prep plan).
  const runDrill = async (difficulty: string, techs: string[], { fallbackToAll = false } = {}) => {
    setDrillLoading(true);
    setDrillError(null);
    try {
      let questions = await fetchTierQuestions(difficulty, techs);
      if (questions.length === 0 && fallbackToAll) questions = await fetchTierQuestions(difficulty, allTechs);
      if (questions.length === 0) {
        setDrillError(t("prep.noQuestionsYet", { tier: difficultyByKey(difficulty)?.label ?? difficulty }));
        return false;
      }
      const entries = buildDrillFromQuestions(questions, { colorByTech, fallbackColor: colors.accent, size: DRILL_SIZE }).map(
        (entry) => ({ ...entry, link: techLinks[entry.tech] })
      );
      setDrill({ questions: entries, index: 0, answered: null, correctCount: 0, done: false, difficulty });
      return true;
    } catch {
      setDrillError(t("prep.drillLoadError"));
      return false;
    } finally {
      setDrillLoading(false);
    }
  };

  const weakestTechs = () =>
    selectDrillTechs(displayCategories, scores.answers, { techCount: 5, boost: struggleBoost });

  const startDrill = (difficulty: string) => runDrill(difficulty, weakestTechs(), { fallbackToAll: true });

  const startReviewDrill = () => runDrill(level, reviewDueTechs);

  const startPlanDrill = () => prepPlan && runDrill(level, prepPlan.techs);

  const dismissPlan = () => {
    clearPrepPlan();
    setPrepPlan(null);
  };

  const startMockLoop = async () => {
    if (await runDrill(level, weakestTechs(), { fallbackToAll: true })) setMockActive(true);
  };

  const exitSession = () => {
    setDrill(null);
    setMockActive(false);
  };

  const startCategoryDrill = async (categoryName: string) => {
    const cat = displayCategories.find((c) => c.name === categoryName);
    if (!cat) return;
    setDrillLoading(true);
    setDrillError(null);
    try {
      const techs = selectCategoryDrillTechs(cat.items, scores.answers, { techCount: cat.items.length });
      let questions = await fetchTierQuestions(level, techs);
      if (questions.length === 0) questions = await fetchTierQuestions(level, Object.keys(colorByTech));
      if (questions.length === 0) {
        setDrillError(t("prep.noQuestionsYet", { tier: difficultyByKey(level)?.label ?? level }));
        return;
      }
      const entries = buildDrillFromQuestions(questions, { colorByTech, fallbackColor: colors.accent, size: DRILL_SIZE }).map(
        (entry) => ({ ...entry, link: techLinks[entry.tech] })
      );
      setActiveCategoryName(categoryName);
      setDrill({ questions: entries, index: 0, answered: null, correctCount: 0, done: false, difficulty: level });
    } catch {
      setDrillError(t("prep.drillLoadError"));
    } finally {
      setDrillLoading(false);
    }
  };

  const applyLevel = (key: string) => {
    setLevel(key);
    setCardState({});
    setPoolSize(null); // pool size is tier-specific; reset so the slider re-calibrates
    setPendingLevel(null);
  };

  // Switch tier instantly, but confirm first if a quiz is mid-flight (would be discarded).
  const requestLevel = (key: string) => {
    if (key === level) return;
    const quizOpen = Object.values(cardState).some((s) => s?.phase === "quiz");
    if (quizOpen) setPendingLevel(key);
    else applyLevel(key);
  };

  const answerDrill = (optionIndex: number) => {
    if (!drill || drill.answered !== null) return;
    const cur = drill.questions[drill.index];
    if (!cur) return;
    const isCorrect = optionIndex === cur.q.correct;
    setDrill({ ...drill, answered: optionIndex, correctCount: drill.correctCount + (isCorrect ? 1 : 0) });
    setPoeCue({ type: isCorrect ? "correct" : "wrong", id: Date.now() });
    record(cur.tech, isCorrect, "drill", drill.difficulty);
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
          accent: colors.success ?? "",
        });
        setPoeCue({ type: "levelUp", id: Date.now() });
      }
      setDrill({ ...drill, done: true });
    } else {
      setDrill({ ...drill, index: nextIndex, answered: null });
    }
  };

  return (
    <WorkspaceLayout
      mainLabel="Interview prep"
      left={
        <PrepLeftRail
          activeCategoryName={activeCategoryName}
          allItems={allItems}
          categories={displayCategories}
          githubStatus={{
            hasUrl: !!githubUsername,
            enabled: githubPrepEnabled,
            loading: githubLoading,
            error: githubError,
            count: githubCategory?.items.length ?? 0,
          }}
          scores={scores}
          search={search}
          setSearch={setSearch}
          onCategory={(name) => {
            setActiveCategoryName(name);
            setSearch("");
            setCardState({});
          }}
          onCategoryDrill={startCategoryDrill}
        />
      }
      right={
        <PrepRightRail
          accuracy={accuracy}
          drillActive={!!drill}
          drillLoading={drillLoading}
          drillError={drillError}
          level={level}
          onLevel={requestLevel}
          onDrill={() => startDrill(level)}
          onMockLoop={startMockLoop}
          onReviewDrill={startReviewDrill}
          reviewDueCount={reviewDueTechs.length}
          scores={scores}
          summary={summary}
          quizSize={quizSize}
          poolSize={poolSize}
          onQuizSize={updateQuizSize}
        />
      }
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, marginBottom: 16 }}>
        <div>
          <p style={{ margin: "0 0 6px", color: colors.textFaint, fontSize: 12, fontWeight: 700 }}>
            {filtered ? `${filtered.length} of ${allItems.length} technologies` : `${displayCategory.items.length} technologies`}
          </p>
          <h1 style={{ margin: 0, color: colors.textBright, fontSize: 26, lineHeight: 1.12, fontWeight: 850 }}>
            {activeTitle}
          </h1>
        </div>
        <p style={{ margin: 0, color: colors.textFaint, fontSize: 12, lineHeight: 1.5, textAlign: "right", maxWidth: 360 }}>
          Tap a card for prep notes, then quiz. The workspace keeps cards compact so scanning stays fast.
        </p>
      </div>

      {prepPlan && !drill && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
            padding: "12px 16px",
            background: colors.surface,
            border: `1px solid ${colors.accent}60`,
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: colors.textBright }}>
              {t("prep.planBanner", { name: prepPlan.name })}
            </span>
            <span style={{ fontSize: 11.5, color: colors.textDim }}>
              {prepPlan.deadline ? t("prep.planDeadline", { date: prepPlan.deadline }) : t("prep.planDeadlineNone")}
              {" · "}
              {prepPlan.techs.join(", ")}
            </span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={dismissPlan}
              style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {t("prep.planDismiss")}
            </button>
            <button
              onClick={startPlanDrill}
              disabled={drillLoading}
              style={{ padding: "6px 14px", background: colors.accent, border: "none", borderRadius: 8, color: colors.onAccent, fontSize: 12, fontWeight: 700, cursor: drillLoading ? "default" : "pointer", opacity: drillLoading ? 0.55 : 1 }}
            >
              {t("prep.planStart")}
            </button>
          </div>
        </div>
      )}

      {drill ? (
        <div style={{ width: "min(100%, 860px)", paddingBottom: 48 }}>
          {mockActive ? (
            <MockLoop drill={drill} onAnswer={answerDrill} onNextQuestion={nextDrill} onExit={exitSession} />
          ) : (
            <DrillSession drill={drill} onAnswer={answerDrill} onNext={nextDrill} onExit={exitSession} />
          )}
        </div>
      ) : visibleItems.length === 0 ? (
        <WorkspacePanel tone="sunken" style={{ textAlign: "center", color: colors.textFaint, padding: 28 }}>
          No matches found.
        </WorkspacePanel>
      ) : (
        <div
          className={styles.cardGrid}
        >
          {visibleItems.map((item, index) => {
            const key = filtered ? `search-${item.tech}` : `${activeCategoryName}-${item.tech}`;
            return (
              <Card
                key={key}
                index={index}
                item={item}
                level={level}
                stat={scores.answers[item.tech]}
                state={getState(key)}
                onFlip={() => handleFlip(key, item)}
                onBack={() => handleFlipBack(key)}
                onAnswer={(i) => handleAnswer(key, item.tech, i)}
                onNext={() => handleNextQuestion(key)}
              />
            );
          })}
        </div>
      )}

      {pendingLevel && (
        <ConfirmDialog
          title={t("prep.switchDifficulty")}
          message={t("prep.switchDifficultyMessage", { level: difficultyByKey(pendingLevel)?.label ?? pendingLevel })}
          confirmLabel={t("prep.switchReload")}
          onConfirm={() => applyLevel(pendingLevel)}
          onCancel={() => setPendingLevel(null)}
        />
      )}

      {celebration && (
        <CelebrationOverlay
          title={celebration.title}
          subtitle={celebration.subtitle}
          accent={celebration.accent}
          onDone={() => setCelebration(null)}
        />
      )}
      <PoeAssistant cue={poeCue} />
    </WorkspaceLayout>
  );
}

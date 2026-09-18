import { useEffect, useRef, useState } from "react";
import { categories } from "@grip/core/prepData";
import { techLinks } from "@grip/core/techLinks";
import { buildGithubTechCategory, githubUsernameFromUrl } from "@grip/core/githubTechs";
import { mergeTechSignals } from "@grip/core/cvTechs";
import { recentStruggledTechs } from "@grip/core/contacts";
import { PERFECT_QUIZ_BONUS, rankForXp } from "@grip/core/gamification";
import { buildDrillFromQuestions, selectCategoryDrillTechs, selectDrillTechs, shuffle, shuffleOptions } from "@grip/core/quiz";
import { difficultyByKey } from "@grip/core/difficulty";
import { computeReadiness } from "@grip/core/readiness";
import { t } from "@grip/core/i18n";
import type { NextUpKind } from "@grip/core/nextUp";
import { useScores } from "./useScores";
import { CelebrationOverlay } from "../components/CelebrationOverlay";
import { colors, font, layout } from "@grip/core/tokens";
import { WorkspaceLayout, WorkspacePanel } from "../components/WorkspaceLayout";
import { PoeAssistant } from "../components/poe/PoeAssistant";
import { getQuizSize, setQuizSize } from "./quizPrefs";
import styles from "./InterviewPrep.module.css";
import type {
  CelebrationState,
  DrillState,
  PoeCue,
  PrepItem,
  QuizQuestion,
} from "./types";
import { Card } from "./Card";
import { DrillSession } from "./DrillSession";
import { MockLoop } from "./MockLoop";
import { NextUpCard } from "./NextUpCard";
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
  // Which cards show their notes side, by card key.
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [drill, setDrill] = useState<DrillState | null>(null);
  // Global difficulty, chosen in the right rail — drives both the quiz cards and drills.
  const [level, setLevel] = useState("mid");
  // Where the loading session was started ("nextup", "cat:<name>", "card:<tech>"), so the
  // spinner and any error show on the control that was clicked.
  const [pending, setPending] = useState<string | null>(null);
  const drillLoading = pending !== null;
  const [drillError, setDrillError] = useState<{ source: string; message: string } | null>(null);
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

  // A short confirmation after changing a setting; `deal` remounts the card grid so the cards re-deal.
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const [deal, setDeal] = useState(0);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // The slider fires on every step while dragging, so size changes only update the notice (no re-deal).
  const updateQuizSize = (value: number | null) => {
    setQuizSize(value);
    setQuizSizeState(value);
    setNotice({ id: Date.now(), text: value === null ? t("prep.sizeNoticeAll") : t("prep.sizeNotice", { size: value }) });
  };
  const previousRank = useRef<{ name: string; min: number } | null>(null);
  // What "Drill again" repeats: whatever started the session that just finished.
  const restartRef = useRef<(() => void) | null>(null);
  // A session replaces the card grid; bring it into view even if it was started from far down.
  const sessionRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    sessionRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [drill?.questions]);

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

  // Readiness scope: the prep plan's techs, else the profile stack, else what's been practiced.
  // Only techs Prep can drill count, so the number can always be moved.
  const practicable = (techs: string[]) => techs.filter((tech) => colorByTech[tech]);
  const planTechs = practicable(prepPlan?.techs ?? []);
  const stackTechs = practicable(combinedSignals.map((s) => s.tech));
  const practicedTechs = practicable(Object.keys(scores.answers));
  const [readinessTechs, readinessLabel] = planTechs.length
    ? [planTechs, t("prep.readinessPlan", { name: prepPlan?.name ?? "" })]
    : stackTechs.length
      ? [stackTechs, t("prep.readinessStack")]
      : [practicedTechs, t("prep.readinessPracticed")];
  const readinessPct = computeReadiness({ postingTechs: readinessTechs, answers: scores.answers }).prep;
  const readiness = readinessPct === null ? null : { pct: readinessPct, label: readinessLabel, count: readinessTechs.length };

  const displayCategory = displayCategories.find((c) => c.name === activeCategoryName) ?? displayCategories[0]!;
  const summary = summarizeScores(scores);
  const visibleItems: PrepItem[] = filtered ?? (displayCategory.items as PrepItem[]).map((item: PrepItem) => ({ ...item, color: item.color ?? displayCategory.color, emoji: displayCategory.emoji }));
  const activeTitle = filtered ? t("prep.searchResults") : displayCategory.name;

  const setFlip = (key: string, value: boolean) => setFlipped((prev) => ({ ...prev, [key]: value }));

  // One session at a time: a running (unfinished) or loading session ignores new starts,
  // so a stray click can't throw away progress. "Drill again" runs from the done screen.
  const sessionBusy = drillLoading || (!!drill && !drill.done);

  // One tech's quiz, opened from its card as a focused session (the same UI as drills).
  const startCardQuiz = async (item: PrepItem) => {
    if (sessionBusy) return;
    restartRef.current = () => startCardQuiz(item);
    setPending(`card:${item.tech}`);
    setDrillError(null);
    try {
      const questions = (await fetchCardQuestions(item.tech))
        ?? (shuffle(item.quiz) as QuizQuestion[]).map(shuffleOptions as (q: QuizQuestion) => QuizQuestion);
      const color = item.color ?? colors.accent ?? "";
      setDrill({
        questions: questions.map((q) => ({ tech: item.tech, color, link: techLinks[item.tech], q })),
        index: 0, answered: null, correctCount: 0, done: false, difficulty: level, source: "card",
      });
    } finally {
      setPending(null);
    }
  };

  // Fetches questions for the given techs and opens the drill UI.
  // `fallbackToAll` widens an empty pool to every tech — wanted for the generic
  // weakest-drill, wrong for targeted drills (review queue, prep plan).
  const runDrill = async (difficulty: string, techs: string[], { fallbackToAll = false, source = "nextup" } = {}) => {
    if (sessionBusy) return false;
    restartRef.current = () => runDrill(difficulty, techs, { fallbackToAll, source });
    setPending(source);
    setDrillError(null);
    try {
      let questions = await fetchTierQuestions(difficulty, techs);
      if (questions.length === 0 && fallbackToAll) questions = await fetchTierQuestions(difficulty, allTechs);
      if (questions.length === 0) {
        setDrillError({ source, message: t("prep.noQuestionsYet", { tier: difficultyByKey(difficulty)?.label ?? difficulty }) });
        return false;
      }
      const entries = buildDrillFromQuestions(questions, { colorByTech, fallbackColor: colors.accent, size: DRILL_SIZE }).map(
        (entry) => ({ ...entry, link: techLinks[entry.tech] })
      );
      setDrill({ questions: entries, index: 0, answered: null, correctCount: 0, done: false, difficulty });
      return true;
    } catch {
      setDrillError({ source, message: t("prep.drillLoadError") });
      return false;
    } finally {
      setPending(null);
    }
  };

  const weakestTechs = () =>
    selectDrillTechs(displayCategories, scores.answers, { techCount: 5, boost: struggleBoost });

  const startDrill = (difficulty: string) => runDrill(difficulty, weakestTechs(), { fallbackToAll: true });

  const startReviewDrill = () => runDrill(level, reviewDueTechs);

  const startPlanDrill = () => prepPlan && runDrill(level, prepPlan.techs);

  const startNextUp = (kind: NextUpKind) => {
    if (kind === "review") startReviewDrill();
    else if (kind === "plan") startPlanDrill();
    else startDrill(level);
  };

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
    if (sessionBusy) return;
    const cat = displayCategories.find((c) => c.name === categoryName);
    if (!cat) return;
    const source = `cat:${categoryName}`;
    setPending(source);
    setDrillError(null);
    try {
      const techs = selectCategoryDrillTechs(cat.items, scores.answers, { techCount: cat.items.length });
      // "Drill again" repeats this category, not the last weakest-drill.
      restartRef.current = () => startCategoryDrill(categoryName);
      let questions = await fetchTierQuestions(level, techs);
      if (questions.length === 0) questions = await fetchTierQuestions(level, Object.keys(colorByTech));
      if (questions.length === 0) {
        setDrillError({ source, message: t("prep.noQuestionsYet", { tier: difficultyByKey(level)?.label ?? level }) });
        return;
      }
      const entries = buildDrillFromQuestions(questions, { colorByTech, fallbackColor: colors.accent, size: DRILL_SIZE }).map(
        (entry) => ({ ...entry, link: techLinks[entry.tech] })
      );
      setActiveCategoryName(categoryName);
      setDrill({ questions: entries, index: 0, answered: null, correctCount: 0, done: false, difficulty: level });
    } catch {
      setDrillError({ source, message: t("prep.drillLoadError") });
    } finally {
      setPending(null);
    }
  };

  // A running session keeps its own tier, so switching never discards anything.
  const changeLevel = (key: string) => {
    if (key === level) return;
    setLevel(key);
    setPoolSize(null); // pool size is tier-specific; reset so the slider re-calibrates
    setDeal((n) => n + 1);
    const tier = difficultyByKey(key);
    setNotice({ id: Date.now(), text: t("prep.levelNotice", { tier: tier?.label ?? key, xp: tier?.xp ?? 0 }) });
  };

  const answerDrill = (optionIndex: number) => {
    if (!drill || drill.answered !== null) return;
    const cur = drill.questions[drill.index];
    if (!cur) return;
    const isCorrect = optionIndex === cur.q.correct;
    setDrill({ ...drill, answered: optionIndex, correctCount: drill.correctCount + (isCorrect ? 1 : 0) });
    setPoeCue({ type: isCorrect ? "correct" : "wrong", id: Date.now() });
    record(cur.tech, isCorrect, drill.source ?? "drill", drill.difficulty);
  };

  const nextDrill = () => {
    if (!drill) return;
    const nextIndex = drill.index + 1;
    if (nextIndex >= drill.questions.length) {
      if (drill.correctCount === drill.questions.length) {
        addXp(PERFECT_QUIZ_BONUS);
        setCelebration({
          title: t(drill.source === "card" ? "celebration.perfectCardTitle" : "celebration.perfectTitle"),
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
      leftRailBottomInset={layout.poeClearance}
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
            setFlipped({});
          }}
          onCategoryDrill={startCategoryDrill}
          pendingCategory={pending?.startsWith("cat:") ? pending.slice(4) : null}
          categoryError={drillError?.source.startsWith("cat:") ? { name: drillError.source.slice(4), message: drillError.message } : null}
          locked={sessionBusy}
        />
      }
      right={
        <PrepRightRail
          accuracy={accuracy}
          level={level}
          onLevel={changeLevel}
          readiness={readiness}
          scores={scores}
          summary={summary}
          quizSize={quizSize}
          poolSize={poolSize}
          onQuizSize={updateQuizSize}
        />
      }
    >
      {!drill && (
        <NextUpCard
          reviewDueCount={reviewDueTechs.length}
          plan={prepPlan}
          attempts={summary.attempts}
          busy={pending === "nextup"}
          disabled={drillLoading}
          error={drillError?.source === "nextup" ? drillError.message : null}
          onStart={startNextUp}
          onMock={startMockLoop}
          onDismissPlan={dismissPlan}
        />
      )}

      {/* The header describes the card grid; a session labels itself, so it hides during one. */}
      {!drill && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18, marginBottom: 16 }}>
          <div>
            <p style={{ margin: "0 0 6px", color: colors.textFaint, fontSize: font.size.small, fontWeight: 700 }}>
              {filtered ? `${filtered.length} of ${allItems.length} technologies` : `${displayCategory.items.length} technologies`}
            </p>
            <h1 style={{ margin: 0, color: colors.textBright, fontSize: font.size.heading, lineHeight: 1.12, fontWeight: 800 }}>
              {activeTitle}
            </h1>
          </div>
          {notice ? (
            <p key={notice.id} role="status" className={styles.notice} style={{ margin: 0, color: colors.accentBright, fontSize: font.size.body, fontWeight: 700, textAlign: "right", maxWidth: 360 }}>
              {notice.text}
            </p>
          ) : (
            <p style={{ margin: 0, color: colors.textDim, fontSize: font.size.body, fontWeight: 600, textAlign: "right", maxWidth: 360 }}>
              {t("prep.steps")}
            </p>
          )}
        </div>
      )}

      {drill ? (
        <div ref={sessionRef} style={{ width: "min(100%, 860px)", paddingBottom: 48, scrollMarginTop: 16 }}>
          {mockActive ? (
            <MockLoop drill={drill} onAnswer={answerDrill} onNextQuestion={nextDrill} onExit={exitSession} />
          ) : (
            <DrillSession
              drill={drill}
              onAnswer={answerDrill}
              onNext={nextDrill}
              onExit={exitSession}
              onRestart={() => restartRef.current?.()}
            />
          )}
        </div>
      ) : visibleItems.length === 0 ? (
        <WorkspacePanel tone="sunken" style={{ textAlign: "center", color: colors.textFaint, padding: 28 }}>
          No matches found.
        </WorkspacePanel>
      ) : (
        <div key={deal} className={styles.cardGrid}>
          {visibleItems.map((item, index) => {
            const key = filtered ? `search-${item.tech}` : `${activeCategoryName}-${item.tech}`;
            return (
              <Card
                key={key}
                index={index}
                item={item}
                level={level}
                stat={scores.answers[item.tech]}
                flipped={!!flipped[key]}
                onFlip={() => setFlip(key, true)}
                onBack={() => setFlip(key, false)}
                onQuiz={() => startCardQuiz(item)}
                loading={pending === `card:${item.tech}`}
              />
            );
          })}
        </div>
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

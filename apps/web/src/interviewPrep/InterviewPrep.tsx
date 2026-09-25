import { useEffect, useRef, useState } from "react";
import { categories } from "@grip/core/prepData";
import { techLinks } from "@grip/core/techLinks";
import { githubUsernameFromUrl } from "@grip/core/githubTechs";
import { recentStruggledTechs } from "@grip/core/contacts";
import { PERFECT_QUIZ_BONUS, rankForXp } from "@grip/core/gamification";
import { selectCategoryDrillTechs, selectDrillTechs, shuffle, shuffleOptions } from "@grip/core/quiz";
import { advanceDrill, allTechs, answerDrill, loadDrill, profileCategories, readinessFor, startDrillState } from "@grip/core/drillSession";
import { difficultyByKey } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import type { NextUpKind } from "@grip/core/nextUp";
import { useScores } from "./useScores";
import { CelebrationOverlay } from "../components/CelebrationOverlay";
import { colors, font, layout } from "@grip/core/tokens";
import { WorkspaceLayout, WorkspacePanel } from "../components/WorkspaceLayout";
import { workspaceFocusStyle } from "../components/fieldStyles";
import { PoeAssistant } from "../components/poe/PoeAssistant";
import { getAutoNext, getLevel, getQuizSize, saveAutoNext, saveLevel, setQuizSize } from "./quizPrefs";
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
import { scrollBehavior } from "../lib/motion";

export default function InterviewPrep() {
  // Track the selected category by name, not list index: the "From GitHub techs"
  // category is prepended once it loads, which would shift every index underneath it.
  const [activeCategoryName, setActiveCategoryName] = useState(categories[0]?.name ?? "");
  // Which cards show their notes side, by card key.
  const [search, setSearch] = useState("");
  const [drill, setDrill] = useState<DrillState | null>(null);
  // Global difficulty, chosen in the right rail — drives both the quiz cards and drills.
  const [level, setLevel] = useState(getLevel);
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
  const [autoNext, setAutoNext] = useState(getAutoNext);
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
  const updateAutoNext = (value: boolean) => {
    saveAutoNext(value);
    setAutoNext(value);
    setNotice({ id: Date.now(), text: t(value ? "prep.autoNextOn" : "prep.autoNextOff") });
  };

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
    sessionRef.current?.scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
  }, [drill?.questions]);

  // CV techs (saved on the profile) join GitHub signals into one "from your profile" category.
  const { allItems, signals, profileCategory: githubCategory, displayCategories } = profileCategories({ githubTechs, cvTechs: profile?.cvTechs ?? [], color: colors.accentBright });

  const filtered = search.trim()
    ? allItems.filter(
        (i) =>
          i.tech.toLowerCase().includes(search.toLowerCase()) ||
          i.oneliner.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const readiness = readinessFor({ plan: prepPlan, stackTechs: signals.map((s) => s.tech), answers: scores.answers });

  const displayCategory = displayCategories.find((c) => c.name === activeCategoryName) ?? displayCategories[0]!;
  const summary = summarizeScores(scores);
  const visibleItems: PrepItem[] = filtered ?? (displayCategory.items as PrepItem[]).map((item: PrepItem) => ({ ...item, color: item.color ?? displayCategory.color, emoji: displayCategory.emoji }));
  const activeTitle = filtered ? t("prep.searchResults") : displayCategory.name;


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
        ...startDrillState(questions.map((q) => ({ tech: item.tech, color, link: techLinks[item.tech], q })), level, Date.now()),
        source: "card",
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
    const loaded = await loadDrill(fetchTierQuestions, difficulty, techs, { fallbackToAll, fallbackColor: colors.accent });
    setPending(null);
    if ("error" in loaded) {
      setDrillError({ source, message: loaded.error });
      return false;
    }
    const entries = loaded.entries.map((entry) => ({ ...entry, link: techLinks[entry.tech] }));
    setDrill(startDrillState(entries, difficulty, Date.now()));
    return true;
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
    const cat = displayCategories.find((c) => c.name === categoryName);
    if (!cat) return;
    const techs = selectCategoryDrillTechs(cat.items, scores.answers, { techCount: cat.items.length });
    // "Drill again" repeats this category, not the last weakest-drill.
    if (await runDrill(level, techs, { fallbackToAll: true, source: `cat:${categoryName}` })) {
      restartRef.current = () => startCategoryDrill(categoryName);
      setActiveCategoryName(categoryName);
    }
  };

  // A running session keeps its own tier, so switching never discards anything.
  const changeLevel = (key: string) => {
    if (key === level) return;
    setLevel(key);
    saveLevel(key);
    setPoolSize(null); // pool size is tier-specific; reset so the slider re-calibrates
    setDeal((n) => n + 1);
    const tier = difficultyByKey(key);
    setNotice({ id: Date.now(), text: t("prep.levelNotice", { tier: tier?.label ?? key, xp: tier?.xp ?? 0 }) });
  };

  const answer = (optionIndex: number) => {
    if (!drill) return;
    // Mock loop runs untimed, so only quizzes and drills can earn the speed bonus.
    const result = answerDrill(drill, optionIndex, { now: Date.now(), timed: !mockActive });
    if (!result) return;
    setDrill(result.drill);
    setPoeCue({ type: result.isCorrect ? "correct" : "wrong", id: Date.now() });
    record(result.tech, result.isCorrect, drill.source ?? "drill", drill.difficulty);
    // ponytail: add_xp isn't retry-safe like record_answer (0014); fine while mutations
    // don't retry. Move the bonus into record_answer if that changes.
    if (result.bonus) addXp(result.bonus);
  };

  const nextDrill = () => {
    if (!drill) return;
    const { drill: next, perfect } = advanceDrill(drill, Date.now());
    if (perfect) {
      addXp(PERFECT_QUIZ_BONUS);
      setCelebration({
        title: t(drill.source === "card" ? "celebration.perfectCardTitle" : "celebration.perfectTitle"),
        subtitle: t("celebration.perfectSubtitle", { bonus: PERFECT_QUIZ_BONUS }),
        accent: colors.success ?? "",
      });
      setPoeCue({ type: "levelUp", id: Date.now() });
    }
    setDrill(next);
  };

  return (
    <WorkspaceLayout
      mainLabel={t("prep.mainLabel")}
      // One session at a time: both rails lock while it runs (rule 10).
      lockedHint={sessionBusy ? t("prep.railLocked") : null}
      leftRailBottomInset={layout.poeClearance}
      left={
        <PrepLeftRail
          activeCategoryName={activeCategoryName}
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
          }}
          onCategoryDrill={startCategoryDrill}
          pendingCategory={pending?.startsWith("cat:") ? pending.slice(4) : null}
          categoryError={drillError?.source.startsWith("cat:") ? { name: drillError.source.slice(4), message: drillError.message } : null}
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
          autoNext={autoNext}
          onAutoNext={updateAutoNext}
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
          {/* The cards explain themselves; this slot only confirms setting changes (rule 14). */}
          {notice && (
            <p key={notice.id} role="status" className={styles.notice} style={{ margin: 0, color: colors.accentBright, fontSize: font.size.body, fontWeight: 700, textAlign: "right", maxWidth: 360 }}>
              {notice.text}
            </p>
          )}
        </div>
      )}

      {drill ? (
        <div ref={sessionRef} style={workspaceFocusStyle}>
          {mockActive ? (
            <MockLoop drill={drill} onAnswer={answer} onNextQuestion={nextDrill} onExit={exitSession} />
          ) : (
            <DrillSession
              drill={drill}
              onAnswer={answer}
              autoNext={autoNext}
              onNext={nextDrill}
              onExit={exitSession}
              onRestart={() => restartRef.current?.()}
            />
          )}
        </div>
      ) : visibleItems.length === 0 ? (
        <WorkspacePanel tone="sunken" style={{ textAlign: "center", color: colors.textFaint, padding: 28 }}>
          {t("prep.noMatches")}
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

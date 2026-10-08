// Answers, XP, review queue and quiz questions.
import type { AccuracyPoint, Question, Scores } from "../api";
import { buildAccuracyTimeline } from "../accuracy.js";
import { buildReviewQueue, type ReviewEntry } from "../review.js";
import { shuffle } from "../quiz.js";
import { fail, type Db } from "./shared";

// Upper bound on how many candidate questions we pull for a techs+difficulty
// fetch before randomizing. Selection happens client-side (see getQuestions),
// so this only needs to comfortably exceed a tier's pool across a few techs.
const QUESTION_FETCH_CAP = 500;

export function scoresApi(supabase: Db) {
  // Per-tech totals and streaks, aggregated in Postgres.
  async function techStats() {
    const { data, error } = await supabase.rpc("answer_tech_stats");
    if (error) fail(error);
    return data;
  }

  async function getScores(): Promise<Scores> {
    const [profile, stats] = await Promise.all([
      supabase.from("profiles").select("xp").maybeSingle(),
      techStats(),
    ]);
    if (profile.error) fail(profile.error);

    const answers: Scores["answers"] = {};
    for (const s of stats) answers[s.tech] = { correct: s.correct, wrong: s.wrong };
    return { xp: profile.data?.xp ?? 0, answers };
  }

  async function getAccuracyTimeline(): Promise<AccuracyPoint[]> {
    // The device's zone, so a late-evening session lands on the local day.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data, error } = await supabase.rpc("answer_daily_totals", { p_tz: tz });
    if (error) fail(error);
    return buildAccuracyTimeline(data);
  }

  /** Spaced-review schedule derived from answer_events. */
  async function getReviewQueue(): Promise<ReviewEntry[]> {
    return buildReviewQueue(await techStats());
  }

  /**
   * Fetches tiered quiz questions for the given techs at one difficulty.
   *
   * `limit` is the number of questions to return, not a DB truncation: we pull
   * the whole candidate pool (capped at QUESTION_FETCH_CAP), shuffle it, then
   * slice. Ordering the query alone would hand back the same first N rows every
   * call and could starve some of the requested techs; randomizing client-side
   * keeps drills varied and spread across all techs.
   */
  async function getQuestions({ techs, difficulty, limit = 10 }: { techs: string[]; difficulty: string; limit?: number }): Promise<Question[]> {
    if (!techs?.length) return [];
    const { data, error } = await supabase
      .from("questions")
      .select("id, tech, category, difficulty, prompt, options, correct, explanation")
      .in("tech", techs)
      .eq("difficulty", difficulty)
      .limit(QUESTION_FETCH_CAP);
    if (error) fail(error);
    // options is jsonb; the seed always writes a string array.
    return shuffle(data).slice(0, limit).map((q) => ({ ...q, options: q.options as string[] }));
  }

  async function recordAnswer(
    tech: string,
    correct: boolean,
    source = "card",
    difficulty: string | null = null,
    requestId: string
  ): Promise<void> {
    const { error } = await supabase.rpc("record_answer", {
      p_request_id: requestId,
      p_tech: tech,
      p_correct: correct,
      p_source: source,
      // Omitted when null; the function defaults it to null.
      p_difficulty: difficulty ?? undefined,
    });
    if (error) fail(error);
  }

  async function addXp(points: number): Promise<void> {
    const { error } = await supabase.rpc("add_xp", { points });
    if (error) fail(error);
  }

  async function resetScores(): Promise<Scores> {
    const { error } = await supabase.rpc("reset_scores");
    if (error) fail(error);

    return { xp: 0, answers: {} };
  }

  return { getScores, getAccuracyTimeline, getReviewQueue, getQuestions, recordAnswer, addXp, resetScores };
}

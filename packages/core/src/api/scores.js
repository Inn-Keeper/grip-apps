// Answers, XP, review queue and quiz questions.
import { buildAccuracyTimeline } from "../accuracy.js";
import { buildReviewQueue } from "../review.js";
import { shuffle } from "../quiz.js";
import { fail } from "./shared.js";

// Upper bound on how many candidate questions we pull for a techs+difficulty
// fetch before randomizing. Selection happens client-side (see getQuestions),
// so this only needs to comfortably exceed a tier's pool across a few techs.
const QUESTION_FETCH_CAP = 500;

/** @param {any} supabase */
export function scoresApi(supabase) {
  async function listAllAnswerEvents(columns) {
    const rows = [];
    let start = 0;
    while (true) {
      const { data, error } = await supabase
        .from("answer_events")
        .select(columns)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(start, start + 999);
      if (error) fail(error);
      if (!data.length) return rows;
      rows.push(...data);
      start += data.length;
    }
  }

  async function getScores() {
    const [profile, events] = await Promise.all([
      supabase.from("profiles").select("xp").maybeSingle(),
      listAllAnswerEvents("tech, correct"),
    ]);
    if (profile.error) fail(profile.error);

    const answers = {};
    for (const e of events) {
      const a = (answers[e.tech] ??= { correct: 0, wrong: 0 });
      if (e.correct) a.correct += 1;
      else a.wrong += 1;
    }
    return { xp: profile.data?.xp ?? 0, answers };
  }

  async function getAccuracyTimeline() {
    return buildAccuracyTimeline(await listAllAnswerEvents("correct, created_at"));
  }

  /** Spaced-review schedule derived from answer_events. */
  async function getReviewQueue() {
    return buildReviewQueue(
      await listAllAnswerEvents("tech, correct, created_at")
    );
  }

  /**
   * Fetches tiered quiz questions for the given techs at one difficulty.
   *
   * `limit` is the number of questions to return, not a DB truncation: we pull
   * the whole candidate pool (capped at QUESTION_FETCH_CAP), shuffle it, then
   * slice. Ordering the query alone would hand back the same first N rows every
   * call and could starve some of the requested techs; randomizing client-side
   * keeps drills varied and spread across all techs.
   * @param {{ techs: string[], difficulty: string, limit?: number }} args
   * @returns {Promise<{ id: string, tech: string, category: string, difficulty: string, prompt: string, options: string[], correct: number, explanation: string | null }[]>}
   */
  async function getQuestions({ techs, difficulty, limit = 10 }) {
    if (!techs?.length) return [];
    const { data, error } = await supabase
      .from("questions")
      .select("id, tech, category, difficulty, prompt, options, correct, explanation")
      .in("tech", techs)
      .eq("difficulty", difficulty)
      .limit(QUESTION_FETCH_CAP);
    if (error) fail(error);
    return shuffle(data).slice(0, limit);
  }

  async function recordAnswer(
    tech,
    correct,
    source = "card",
    difficulty = null,
    requestId
  ) {
    const { error } = await supabase.rpc("record_answer", {
      p_request_id: requestId,
      p_tech: tech,
      p_correct: correct,
      p_source: source,
      p_difficulty: difficulty,
    });
    if (error) fail(error);
  }

  async function addXp(points) {
    const { error } = await supabase.rpc("add_xp", { points });
    if (error) fail(error);
  }

  async function resetScores() {
    const { error } = await supabase.rpc("reset_scores");
    if (error) fail(error);

    return { xp: 0, answers: {} };
  }

  return { getScores, getAccuracyTimeline, getReviewQueue, getQuestions, recordAnswer, addXp, resetScores };
}

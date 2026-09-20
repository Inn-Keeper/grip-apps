import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGithubTechSignals } from "@grip/core/githubTechs";
import { questionCapForPool } from "@grip/core/quizPrefs";
import { shuffleOptions } from "@grip/core/quiz";
import { drawUnseen } from "./questionDeck";
import * as api from "../lib/api";
import type { AccuracyPoint, QuizQuestion } from "./types";

const CARD_POOL_LIMIT = 500;
const DRILL_SIZE = 10;
const GITHUB_TECHS_STALE_MS = 1000 * 60 * 15;

export const prepQueryKeys = {
  accuracyTimeline: ["accuracy-timeline"] as const,
  reviewQueue: ["review-queue"] as const,
  contacts: ["contacts"] as const, // shared with Quest — read here for retro struggle boosts
  profile: ["profile"] as const,
  githubTechs: (githubUsername: string) => ["github-techs", githubUsername] as const,
  cardQuestions: (level: string, tech: string, limit = CARD_POOL_LIMIT) =>
    ["questions", "v2", "card-pool", level, tech, limit] as const,
  tierQuestions: (difficulty: string, techs: string[]) => ["questions", "v2", difficulty, techs] as const,
};

export function useAccuracyTimelineQuery() {
  return useQuery<AccuracyPoint[]>({
    queryKey: prepQueryKeys.accuracyTimeline,
    queryFn: api.getAccuracyTimeline as () => Promise<AccuracyPoint[]>,
  });
}

export function usePrepProfileQuery() {
  return useQuery({ queryKey: prepQueryKeys.profile, queryFn: api.getUser });
}

export function useReviewQueueQuery() {
  return useQuery({ queryKey: prepQueryKeys.reviewQueue, queryFn: api.getReviewQueue });
}

export function usePrepContactsQuery() {
  return useQuery({ queryKey: prepQueryKeys.contacts, queryFn: api.listContacts });
}

export function useGithubTechsQuery(githubUsername: string, allTechs: string[], enabled: boolean) {
  return useQuery({
    queryKey: prepQueryKeys.githubTechs(githubUsername),
    queryFn: () => fetchGithubTechSignals(githubUsername, allTechs),
    enabled,
    staleTime: GITHUB_TECHS_STALE_MS,
  });
}

export function usePrepQuestionFetchers(level: string, quizSize: number | null, onCardPoolSize?: (size: number) => void) {
  const queryClient = useQueryClient();

  // The whole pool is fetched (and cached briefly); the deck then picks unseen questions,
  // outside the cache, so "Drill again" never gets the same cached draw back.
  const fetchTierQuestions = async (difficulty: string, techs: string[]) => {
    const pool = await queryClient.fetchQuery({
      queryKey: prepQueryKeys.tierQuestions(difficulty, techs),
      queryFn: () => api.getQuestions({ techs, difficulty, limit: CARD_POOL_LIMIT }),
    });
    return drawUnseen(difficulty, pool, DRILL_SIZE);
  };

  const fetchCardQuestions = async (tech: string): Promise<QuizQuestion[] | null> => {
    try {
      const rows = await queryClient.fetchQuery({
        queryKey: prepQueryKeys.cardQuestions(level, tech),
        queryFn: () => api.getQuestions({ techs: [tech], difficulty: level, limit: CARD_POOL_LIMIT }),
      });
      if (rows.length) {
        onCardPoolSize?.(rows.length);
        const cap = questionCapForPool(quizSize, rows.length);
        return drawUnseen(level, rows, cap).map((r) => shuffleOptions({ question: r.prompt, options: r.options, correct: r.correct }));
      }
      console.warn(`No ${level} questions in the DB for "${tech}" — falling back to static prep questions (these don't vary by level). Run the questions seed.`);
    } catch (err) {
      console.error(`Failed to load ${level} questions for "${tech}"; using static prep questions.`, err);
    }
    return null;
  };

  return { fetchTierQuestions, fetchCardQuestions };
}

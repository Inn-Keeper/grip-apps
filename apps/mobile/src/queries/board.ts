import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SavedBoard } from "@grip/core/api";
import type { Scenario } from "@grip/core/arch";
import { buildScenarioCatalog } from "@grip/core/scenarioCatalog";
import { api, talkGrade } from "@/lib/api";

export const boardQueryKeys = {
  boards: ["arch-boards"] as const,
  // Same key as web, so both apps describe the same cache entry.
  customScenarios: ["custom-scenarios"] as const,
  gradingStatus: ["talk-grade-status"] as const,
};

/** What grip-ai-api returns from /api/v1/ai/grade-talk-track. */
export type TalkGradeResult = {
  board_id: string;
  score: number;
  divergence: number | null;
  suggestion: {
    sections: { section: string; verdict: "covered" | "thin" | "missing"; evidence: string; gap: string }[];
    hardest_followup: string;
  };
};

export type GradingStatus = { grading: "available" | "unavailable"; retry_after?: number };

export const talkGradeEnabled = Boolean(talkGrade);

// The service answers from memory of its last rate limit, so this spends no quota.
export function useGradingStatusQuery(enabled: boolean) {
  return useQuery({
    queryKey: boardQueryKeys.gradingStatus,
    queryFn: () => talkGrade!.getGradingStatus() as Promise<GradingStatus>,
    enabled: enabled && talkGradeEnabled,
    // A limit lapses on its own, so a stale "unavailable" must not stick.
    staleTime: 30_000,
  });
}

export function useGradeTalkTrackMutation(onGraded: (result: TalkGradeResult) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { boardId: string; facts: object; sections: Record<string, string>; selfRating: number | null }) =>
      (await talkGrade!.gradeTalkTrack(input)) as TalkGradeResult,
    onSuccess: onGraded,
    onError: (error: Error & { status?: number }) => {
      // A refusal is how the service learns the limit; pick it up at once.
      if (error.status === 429) queryClient.invalidateQueries({ queryKey: boardQueryKeys.gradingStatus });
    },
  });
}

export function useSavedBoardsQuery() {
  return useQuery<SavedBoard[]>({ queryKey: boardQueryKeys.boards, queryFn: api.listBoards });
}

// Built-in plus the user's own scenarios (created on web), grouped for the picker.
export function useScenarioCatalog() {
  const { data: customScenarios, isFetching } = useQuery({ queryKey: boardQueryKeys.customScenarios, queryFn: api.listCustomScenarios });
  const catalog = useMemo(() => {
    const { allScenarios, groups } = buildScenarioCatalog(customScenarios ?? []);
    return { allScenarios: allScenarios as Scenario[], groups };
  }, [customScenarios]);
  return { ...catalog, isFetching };
}

export function useSaveBoardMutation(
  onSaved: (board: { id?: string; title: string }) => void,
  onError: (error: Error) => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.upsertBoard,
    onSuccess: (board: { id?: string; title: string }) => {
      onSaved(board);
      queryClient.invalidateQueries({ queryKey: boardQueryKeys.boards });
    },
    onError,
  });
}

export function useDeleteBoardMutation(onDeleted: (id: string) => void, onError: (error: Error) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteBoard,
    onSuccess: (_data: unknown, id: string) => {
      onDeleted(id);
      queryClient.invalidateQueries({ queryKey: boardQueryKeys.boards });
    },
    onError,
  });
}

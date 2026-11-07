import { useEffect } from "react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Scores } from "@grip/core/api";
import {
  EMPTY_SCORES, freshUnsaved, SCORES_KEY, UNSAVED_KEY, WRITE_KEY,
  newRequestId, scoreMutations, watchScoreWrites, type SaveStatus, type Unsaved,
} from "@grip/core/scoreStore";
import { addXp, getScores, recordAnswer } from "../lib/api";

const scoreApi = { getScores, recordAnswer, addXp };

export type { SaveStatus };

// Quiz score store backed by Supabase (profiles + answer_events); writes apply optimistically.
export function useScores() {
  const queryClient = useQueryClient();
  const { data, isError } = useQuery<Scores>({ queryKey: SCORES_KEY, queryFn: scoreApi.getScores });
  const { data: unsaved } = useQuery<Unsaved>({ queryKey: UNSAVED_KEY, queryFn: freshUnsaved, initialData: freshUnsaved, staleTime: Infinity, gcTime: Infinity });
  const pending = useIsMutating({ mutationKey: WRITE_KEY });
  useEffect(() => watchScoreWrites(queryClient), [queryClient]);

  const store = scoreMutations(queryClient, scoreApi);
  const recordMutation = useMutation(store.record);
  const xpMutation = useMutation(store.xp);

  const saveStatus: SaveStatus = {
    pending,
    failed: unsaved.answers.length,
    bonusFailed: unsaved.bonusFailed,
    loadFailed: isError && !data,
    retry: () => store.retry(unsaved, recordMutation.mutate),
  };

  return {
    scores: data ?? EMPTY_SCORES,
    // False until the real scores arrive; `scores` is EMPTY until then.
    scoresReady: data !== undefined,
    saveStatus,
    record: (tech: string, isCorrect: boolean, source = "card", difficulty: string | null = null) =>
      recordMutation.mutate({ scope: unsaved.scope, requestId: newRequestId(), tech, isCorrect, source, difficulty }),
    addXp: (points: number) => xpMutation.mutate({ points, scope: unsaved.scope }),
  };
}

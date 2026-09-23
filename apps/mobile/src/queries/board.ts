import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SavedBoard } from "@grip/core/api";
import type { Scenario } from "@grip/core/arch";
import { buildScenarioCatalog } from "@grip/core/scenarioCatalog";
import { api } from "@/lib/api";

export const boardQueryKeys = {
  boards: ["arch-boards"] as const,
  // Same key as web, so both apps describe the same cache entry.
  customScenarios: ["custom-scenarios"] as const,
};

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

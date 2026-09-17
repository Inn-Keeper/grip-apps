import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SavedBoard } from "@grip-apps/core/api";
import { api } from "@/lib/api";

export const boardQueryKeys = {
  boards: ["arch-boards"] as const,
};

export function useSavedBoardsQuery() {
  return useQuery<SavedBoard[]>({ queryKey: boardQueryKeys.boards, queryFn: api.listBoards });
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

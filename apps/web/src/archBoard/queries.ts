import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../lib/api";
import type { BoardSummary, SavedBoard } from "./types";

export const archBoardQueryKeys = {
  boards: ["arch-board-summaries"] as const,
  // Full boards (nodes + edges) for Quest scoring. Must not share the summaries key:
  // summaries lack nodes/edges, and a shared cache entry crashed Quest's evaluate().
  fullBoards: ["arch-boards-full"] as const,
  board: (id: string) => ["arch-board", id] as const,
  customScenarios: ["custom-scenarios"] as const,
};

export function useCustomScenariosQuery() {
  return useQuery({
    queryKey: archBoardQueryKeys.customScenarios,
    queryFn: api.listCustomScenarios,
  });
}

export function useSavedBoardsQuery(enabled = true) {
  return useQuery({
    queryKey: archBoardQueryKeys.boards,
    queryFn: api.listBoardSummaries,
    enabled,
  });
}

export function useLoadBoard() {
  const queryClient = useQueryClient();
  return (id: string) => queryClient.fetchQuery({ queryKey: archBoardQueryKeys.board(id), queryFn: () => api.getBoard(id), staleTime: 0 });
}

export function useSaveBoardMutation(onSaved: (board: SavedBoard) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.upsertBoard,
    onSuccess: (board: SavedBoard) => {
      onSaved(board);
      if (board.id) queryClient.setQueryData(archBoardQueryKeys.board(board.id), board);
      queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.fullBoards });
      queryClient.setQueryData<BoardSummary[]>(archBoardQueryKeys.boards, (current) => {
        if (!current || !board.id) return current;
        const summary: BoardSummary = { id: board.id, title: board.title, scenarioId: board.scenarioId,
          shareToken: board.shareToken ?? null, createdAt: board.createdAt ?? new Date().toISOString(), updatedAt: board.updatedAt ?? new Date().toISOString() };
        return [summary, ...current.filter((item) => item.id !== board.id)];
      });
    },
  });
}

export function useShareBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) => api.setBoardSharing(id, enable),
    onSuccess: (token, variables) => queryClient.setQueryData<BoardSummary[]>(archBoardQueryKeys.boards,
      (current) => current?.map((item) => item.id === variables.id ? { ...item, shareToken: token } : item)),
  });
}

export function useDeleteBoardMutation(onDeleted: (id: string) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteBoard,
    onSuccess: (_data: unknown, id: string) => {
      onDeleted(id);
      queryClient.removeQueries({ queryKey: archBoardQueryKeys.board(id) });
      queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.fullBoards });
      queryClient.setQueryData<BoardSummary[]>(archBoardQueryKeys.boards, (current) => current?.filter((item) => item.id !== id));
    },
  });
}

export function useSaveScenarioMutation(onSaved: (saved: { id: string }) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scenario: object) => api.upsertCustomScenario(scenario) as Promise<{ id: string }>,
    onSuccess: (saved: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.customScenarios });
      onSaved(saved);
    },
  });
}

export function useDeleteScenarioMutation(onDeleted: (id: string) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCustomScenario,
    onSuccess: (_data: unknown, id: string) => {
      queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.customScenarios });
      onDeleted(id);
    },
  });
}

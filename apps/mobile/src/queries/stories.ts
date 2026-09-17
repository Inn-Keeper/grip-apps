import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Story } from "@grip/core/api";
import { api } from "@/lib/api";

export const storyQueryKeys = {
  stories: ["stories"] as const,
};

export function useStoriesQuery() {
  return useQuery<Story[]>({ queryKey: storyQueryKeys.stories, queryFn: api.listStories });
}

function useInvalidateStories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: storyQueryKeys.stories });
}

export function useSaveStoryMutation() {
  const invalidate = useInvalidateStories();
  return useMutation({ mutationFn: api.upsertStory, onSettled: invalidate });
}

export function useDeleteStoryMutation() {
  const invalidate = useInvalidateStories();
  return useMutation({ mutationFn: api.deleteStory, onSettled: invalidate });
}

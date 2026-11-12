import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buildStoryAssessment } from "@grip/core/storyGrade";
import type { StoryGradeResult } from "@grip/core/api";
import * as api from "../lib/api";
import type { Story } from "./types";

export const storyQueryKeys = {
  stories: ["stories"] as const,
};

export function useStoriesQuery() {
  return useQuery({ queryKey: storyQueryKeys.stories, queryFn: api.listStories });
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

// False when VITE_AI_URL is unset, which hides the Grade action.
export const storyGradeEnabled = Boolean(api.storyGrade);

// Grades a story and saves the result with the text it was graded on.
export function useGradeStoryMutation() {
  const invalidate = useInvalidateStories();
  return useMutation({
    mutationFn: async (story: Story) => {
      const client = api.storyGrade;
      if (!client || !story.id) throw new Error("storyGrade: unavailable");
      const result = (await client.gradeStory({ ...story, id: story.id })) as StoryGradeResult;
      await api.saveStoryAssessment(story.id, buildStoryAssessment(story, result));
    },
    onSuccess: invalidate,
  });
}

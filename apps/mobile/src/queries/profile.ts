import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserIdentity } from "@supabase/supabase-js";
import { api } from "@/lib/api";
import { linkGitHubIdentity } from "@/lib/oauth";
import { supabase } from "@/lib/supabase";

export const profileQueryKeys = {
  profile: ["profile"] as const,
  authIdentities: ["auth-identities"] as const,
  githubTechs: ["github-techs"] as const,
  scores: ["scores"] as const,
  accuracyTimeline: ["accuracy-timeline"] as const,
};

export function useProfileQuery() {
  return useQuery({ queryKey: profileQueryKeys.profile, queryFn: api.getUser });
}

export function useAuthIdentitiesQuery() {
  return useQuery({
    queryKey: profileQueryKeys.authIdentities,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUserIdentities();
      if (error) throw error;
      return data.identities ?? [];
    },
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (saved) => queryClient.setQueryData(profileQueryKeys.profile, saved),
  });
}

export function useLinkGitHubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkGitHubIdentity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.authIdentities });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile });
    },
  });
}

export function useGithubPrepMutation(profile: { githubUrl?: string | null } | null, displayGithubUrl: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (useGithubTechsForPrep: boolean) =>
      api.updateProfile({
        useGithubTechsForPrep,
        ...(useGithubTechsForPrep && displayGithubUrl && !profile?.githubUrl ? { githubUrl: displayGithubUrl } : {}),
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(profileQueryKeys.profile, saved);
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.githubTechs });
    },
  });
}

export function useSaveFavoriteTechsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteTechs: string[]) => api.updateProfile({ favoriteTechs }),
    onSuccess: (saved) => queryClient.setQueryData(profileQueryKeys.profile, saved),
  });
}

export function useSaveCvTechsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cvTechs: string[]) => api.updateProfile({ cvTechs }),
    onSuccess: (saved) => {
      queryClient.setQueryData(profileQueryKeys.profile, saved);
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.githubTechs });
    },
  });
}

export function useResetScoresMutation(profile: { xp?: number } | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.resetScores,
    onSuccess: () => {
      queryClient.setQueryData(profileQueryKeys.scores, { xp: 0, answers: {} });
      if (profile) queryClient.setQueryData(profileQueryKeys.profile, { ...profile, xp: 0 });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.accuracyTimeline });
    },
  });
}

export type AuthIdentity = UserIdentity;

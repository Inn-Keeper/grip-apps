import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserIdentity } from "@supabase/supabase-js";
import * as api from "../lib/api";
import { supabase } from "../lib/supabase";
import { friendlyAuthError } from "@grip/core/auth";

const GITHUB_LINK_PENDING_KEY = "grip.githubLinkPending";

export const profileQueryKeys = {
  profile: ["profile"] as const,
  authIdentities: ["auth-identities"] as const,
  authUser: ["auth-user"] as const,
  githubViewerUrl: (githubLinked: boolean) => ["github-viewer-url", githubLinked] as const,
  githubPublicUrl: (githubAccountId: string) => ["github-public-url", githubAccountId] as const,
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

export function useAuthUserQuery() {
  return useQuery({
    queryKey: profileQueryKeys.authUser,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ?? null;
    },
  });
}

export function useGithubViewerUrlQuery(githubLinked: boolean) {
  return useQuery({
    queryKey: profileQueryKeys.githubViewerUrl(githubLinked),
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.provider_token;
      if (!token) return "";
      const response = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return "";
      const viewer = await response.json();
      return typeof viewer.html_url === "string" ? viewer.html_url : "";
    },
    enabled: githubLinked,
    retry: false,
    staleTime: 1000 * 60 * 15,
  });
}

export function useGithubPublicUrlQuery(githubAccountId: string) {
  return useQuery({
    queryKey: profileQueryKeys.githubPublicUrl(githubAccountId),
    queryFn: async () => {
      if (!githubAccountId) return "";
      const response = await fetch(`https://api.github.com/user/${encodeURIComponent(githubAccountId)}`);
      if (!response.ok) return "";
      const user = await response.json();
      return typeof user.html_url === "string" ? user.html_url : "";
    },
    enabled: !!githubAccountId,
    retry: false,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (saved) => {
      queryClient.setQueryData(profileQueryKeys.profile, saved);
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.scores });
    },
  });
}

export function useSaveGithubUrlMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (githubUrl: string) => api.updateProfile({ githubUrl }),
    onSuccess: (saved) => {
      queryClient.setQueryData(profileQueryKeys.profile, saved);
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.githubTechs });
    },
  });
}

export function useGithubPrepMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (useGithubTechsForPrep: boolean) => api.updateProfile({ useGithubTechsForPrep }),
    onSuccess: (saved) => {
      queryClient.setQueryData(profileQueryKeys.profile, saved);
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.githubTechs });
    },
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

export function useLinkGitHubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      window.localStorage.setItem(GITHUB_LINK_PENDING_KEY, "1");
      const { data, error } = await supabase.auth.linkIdentity({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/?linked=github`, skipBrowserRedirect: true },
      });
      if (error) {
        window.localStorage.removeItem(GITHUB_LINK_PENDING_KEY);
        throw new Error(friendlyAuthError(error.message));
      }
      if (data?.url) window.location.assign(data.url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.authIdentities });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.authUser });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile });
    },
  });
}

export type AuthIdentity = UserIdentity;

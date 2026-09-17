import { isGithubProfileUrl } from "@grip-apps/core/githubUrl";

export function githubUrlFromIdentity(identity: { identity_data?: Record<string, unknown> } | undefined) {
  const data = identity?.identity_data ?? {};
  const directUrl = (
    data.html_url ||
    data.profile_url ||
    (typeof data.avatar_url === "string" ? data.avatar_url.replace(/\/?u\/\d+.*/, "") : "")
  ) as string;
  if (isGithubProfileUrl(directUrl)) {
    return directUrl;
  }
  return githubUrlFromMetadata(data);
}

export function githubUrlFromMetadata(data: Record<string, unknown> | undefined) {
  const username = data?.user_name || data?.preferred_username || data?.login;
  return username ? `https://github.com/${username}` : "";
}

export function githubAccountIdFromIdentity(identity: { identity_data?: Record<string, unknown> } | undefined) {
  return githubAccountIdFromMetadata(identity?.identity_data);
}

export function githubAccountIdFromMetadata(data: Record<string, unknown> | undefined) {
  const id = data?.provider_id || data?.sub || data?.id;
  return id ? String(id) : "";
}

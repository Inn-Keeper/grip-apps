// The signed-in user's profile.
import { fail } from "./shared.js";

/** @param {any} supabase */
export function profileApi(supabase) {
  const profileToUi = (row, authUser = null) => {
    const metadata = authUser?.user_metadata ?? {};
    const githubUsername = metadata.user_name ?? metadata.preferred_username ?? "";
    return {
      id: row?.user_id ?? authUser?.id ?? "",
      displayName:
        row?.display_name ??
        metadata.display_name ??
        metadata.full_name ??
        metadata.name ??
        "",
      email: authUser?.email ?? row?.email ?? "",
      avatarUrl: row?.avatar_url ?? metadata.avatar_url ?? "",
      headline: row?.headline ?? "",
      targetRole: row?.target_role ?? "",
      location: row?.location ?? "",
      portfolioUrl: row?.portfolio_url ?? "",
      githubUrl: row?.github_url ?? (githubUsername ? `https://github.com/${githubUsername}` : ""),
      useGithubTechsForPrep: row?.use_github_techs_for_prep ?? false,
      cvTechs: row?.cv_techs ?? [],
      linkedinUrl: row?.linkedin_url ?? "",
      timezone: row?.timezone ?? "",
      onboardingCompleted: row?.onboarding_completed ?? false,
      xp: row?.xp ?? 0,
      createdAt: row?.created_at ?? null,
      updatedAt: row?.updated_at ?? null,
    };
  };

  const profileToDb = (profile) => {
    const row = {};
    const textFields = [
      ["displayName", "display_name"],
      ["avatarUrl", "avatar_url"],
      ["headline", "headline"],
      ["targetRole", "target_role"],
      ["location", "location"],
      ["portfolioUrl", "portfolio_url"],
      ["githubUrl", "github_url"],
      ["linkedinUrl", "linkedin_url"],
      ["timezone", "timezone"],
    ];
    for (const [uiKey, dbKey] of textFields) {
      if (uiKey in profile) row[dbKey] = profile[uiKey]?.trim() || null;
    }
    if ("onboardingCompleted" in profile) row.onboarding_completed = profile.onboardingCompleted ?? false;
    if ("useGithubTechsForPrep" in profile) row.use_github_techs_for_prep = profile.useGithubTechsForPrep ?? false;
    if ("cvTechs" in profile) row.cv_techs = profile.cvTechs ?? [];
    return row;
  };

  async function getUser() {
    const auth = await supabase.auth.getUser();
    if (auth.error) fail(auth.error);
    if (!auth.data.user) return null;

    const profile = await supabase.from("profiles").select("*").maybeSingle();
    if (profile.error) fail(profile.error);
    return profileToUi(profile.data, auth.data.user);
  }

  async function updateProfile(profile) {
    const auth = await supabase.auth.getUser();
    if (auth.error) fail(auth.error);
    if (!auth.data.user) throw new Error("No signed-in user.");

    const row = {
      user_id: auth.data.user.id,
      email: auth.data.user.email,
      ...profileToDb(profile),
    };
    const { data, error } = await supabase.from("profiles").upsert(row).select("*").single();
    if (error) fail(error);
    return profileToUi(data, auth.data.user);
  }

  return { getUser, updateProfile };
}

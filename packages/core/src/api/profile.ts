// The signed-in user's profile.
import type { User as AuthUser } from "@supabase/supabase-js";
import type { User } from "../api";
import { fail, type Db, type Tables, type TablesInsert } from "./shared";

type ProfileRow = Tables<"profiles">;
// Every column is mapped; listed so a new column is fetched only once the UI uses it.
const PROFILE_COLUMNS =
  "user_id,display_name,email,avatar_url,headline,target_role,location,portfolio_url,github_url,use_github_techs_for_prep,cv_techs,linkedin_url,timezone,onboarding_completed,xp,created_at,updated_at,favorite_techs" as const;
type ProfileUpdate = Omit<TablesInsert<"profiles">, "user_id" | "email">;

// UI field -> column for the free-text fields; blanks are stored as null.
const TEXT_FIELDS = [
  ["displayName", "display_name"],
  ["avatarUrl", "avatar_url"],
  ["headline", "headline"],
  ["targetRole", "target_role"],
  ["location", "location"],
  ["portfolioUrl", "portfolio_url"],
  ["githubUrl", "github_url"],
  ["linkedinUrl", "linkedin_url"],
  ["timezone", "timezone"],
] as const satisfies readonly (readonly [keyof User, keyof ProfileUpdate])[];

export function profileApi(supabase: Db) {
  // Maps a database row to the UI model, using authUser for fallback values.
  const profileToUi = (row: ProfileRow | null, authUser: AuthUser | null = null): User => {
    const metadata = authUser?.user_metadata ?? {};
    const githubUsername = metadata.user_name ?? metadata.preferred_username ?? "";
    return {
      id: row?.user_id ?? authUser?.id ?? "",
      displayName: row?.display_name ?? metadata.display_name ?? metadata.full_name ?? metadata.name ?? "",
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
      favoriteTechs: row?.favorite_techs ?? [],
    };
  };

  const profileToDb = (profile: Partial<User>): ProfileUpdate => {
    const row: ProfileUpdate = {};
    for (const [uiKey, dbKey] of TEXT_FIELDS) {
      if (uiKey in profile) row[dbKey] = profile[uiKey]?.trim() || null;
    }
    if ("onboardingCompleted" in profile) row.onboarding_completed = profile.onboardingCompleted ?? false;
    if ("useGithubTechsForPrep" in profile) row.use_github_techs_for_prep = profile.useGithubTechsForPrep ?? false;
    if ("cvTechs" in profile) row.cv_techs = profile.cvTechs ?? [];
    if ("favoriteTechs" in profile) row.favorite_techs = profile.favoriteTechs ?? [];
    return row;
  };

  async function getUser(): Promise<User | null> {
    const auth = await supabase.auth.getUser();
    if (auth.error) fail(auth.error);
    if (!auth.data.user) return null;

    const profile = await supabase.from("profiles").select(PROFILE_COLUMNS).maybeSingle();
    if (profile.error) fail(profile.error);
    return profileToUi(profile.data, auth.data.user);
  }

  async function updateProfile(profile: Partial<User>): Promise<User> {
    // Local session, no auth-server round trip: RLS still checks user_id on write.
    const auth = await supabase.auth.getSession();
    if (auth.error) fail(auth.error);
    const user = auth.data.session?.user;
    if (!user) throw new Error("No signed-in user.");

    const row = {
      user_id: user.id,
      email: user.email,
      ...profileToDb(profile),
    };
    const { data, error } = await supabase.from("profiles").upsert(row).select(PROFILE_COLUMNS).single();
    if (error) fail(error);
    return profileToUi(data, user);
  }

  return { getUser, updateProfile };
}

// The signed-in user's saved preparation and active playbook (migration 0030).
import { fail, type Db, type Json } from "./shared";

export type PreparationGoal = "technical" | "stories" | "design" | "explore";
export type PreparationSnapshot = {
  version: 1;
  role: string;
  goal: PreparationGoal;
  brief: string;
  techs: string[];
  favoriteTechs: string[];
  locale: string;
};
export type ActivePlaybook = {
  generationId: string;
  snapshot: PreparationSnapshot;
  label: string;
  scenarioId: string;
  boardId: string | null;
  storyIds: string[];
  createdAt: string;
};
export type PreparationRecord = {
  goal: PreparationGoal;
  brief: string;
  githubTechs: string[];
  githubSyncedAt: string | null;
  activePlaybook: ActivePlaybook | null;
};
export type PreparationProfilePatch = { targetRole: string; goalTechs: string[]; favoriteTechs: string[]; cvTechs: string[] };
/** DB-ready playbook: checks already trimmed, board optional. */
export type PublishablePlaybook = {
  scenario: { name: string; brief: string; checks: unknown[] };
  board?: { title: string; nodes: unknown[] } | null;
  stories: Array<{ title: string; competency: string; situation?: string; task?: string; action?: string; result?: string; technical: boolean }>;
};

export function preparationApi(supabase: Db) {
  async function getPreparation(): Promise<PreparationRecord | null> {
    // RLS returns only the caller's row.
    const { data, error } = await supabase
      .from("user_preparation")
      .select("goal,brief,github_techs,github_synced_at,active_playbook")
      .maybeSingle();
    if (error) fail(error);
    if (!data) return null;
    return {
      goal: data.goal as PreparationGoal,
      brief: data.brief ?? "",
      githubTechs: data.github_techs ?? [],
      githubSyncedAt: data.github_synced_at ?? null,
      activePlaybook: (data.active_playbook as ActivePlaybook | null) ?? null,
    };
  }

  // Profile fields and preparation are written in one transaction, or not at all.
  async function savePreparation({ profilePatch, goal, brief }: { profilePatch: PreparationProfilePatch; goal: PreparationGoal; brief: string }) {
    const { error } = await supabase.rpc("save_preparation", {
      p_target_role: profilePatch.targetRole,
      p_goal_techs: profilePatch.goalTechs,
      p_favorite_techs: profilePatch.favoriteTechs,
      p_cv_techs: profilePatch.cvTechs,
      p_goal: goal,
      p_brief: brief,
    });
    if (error) fail(error);
  }

  // Empty acceptedTechs records a successful fetch only; favourites are never sent.
  async function saveGithubSignals({ acceptedTechs, syncedAt }: { acceptedTechs: string[]; syncedAt: string | null }) {
    const { error } = await supabase.rpc("save_github_signals", { p_accepted: acceptedTechs, p_synced_at: syncedAt });
    if (error) fail(error);
  }

  async function publishPreparationPlaybook(input: {
    generationId: string;
    expectedGenerationId: string | null;
    snapshot: PreparationSnapshot;
    label: string;
    playbook: PublishablePlaybook;
  }): Promise<ActivePlaybook> {
    const { data, error } = await supabase.rpc("publish_preparation_playbook", {
      p_generation_id: input.generationId,
      p_expected_generation_id: input.expectedGenerationId,
      p_snapshot: input.snapshot as unknown as Json,
      p_label: input.label,
      p_playbook: input.playbook as unknown as Json,
    });
    if (error) fail(error);
    return data as unknown as ActivePlaybook;
  }

  return { getPreparation, savePreparation, saveGithubSignals, publishPreparationPlaybook };
}

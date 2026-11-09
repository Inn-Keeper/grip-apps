import { preparationApi } from "../api/preparation";

// Fake client: one preparation row, recorded rpc calls, optional rpc errors.
function fake({ row = null, rpcError = null, rpcData = null } = {}) {
  const rpcs = [];
  const client = {
    from: () => ({ select: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }),
    rpc: async (fn, args) => {
      rpcs.push({ fn, args });
      return { data: rpcData, error: rpcError };
    },
  };
  return { api: preparationApi(client), rpcs };
}

const row = {
  user_id: "u1",
  goal: "design",
  brief: "payments",
  github_techs: ["go"],
  github_synced_at: "2026-11-09T10:00:00Z",
  active_playbook: { generationId: "g1", snapshot: { version: 1 }, label: "L", scenarioId: "s1", boardId: null, storyIds: ["a"], createdAt: "x" },
};

describe("preparation api", () => {
  it("returns null when no row exists", async () => {
    expect(await fake().api.getPreparation()).toBeNull();
  });

  it("maps a row to the UI record", async () => {
    expect(await fake({ row }).api.getPreparation()).toEqual({
      goal: "design",
      brief: "payments",
      githubTechs: ["go"],
      githubSyncedAt: "2026-11-09T10:00:00Z",
      activePlaybook: row.active_playbook,
    });
  });

  it("saves profile fields and preparation in one rpc", async () => {
    const { api, rpcs } = fake();
    await api.savePreparation({
      profilePatch: { targetRole: "SRE", goalTechs: ["go"], favoriteTechs: ["k8s"], cvTechs: [] },
      goal: "technical",
      brief: "",
    });
    expect(rpcs).toEqual([
      {
        fn: "save_preparation",
        args: { p_target_role: "SRE", p_goal_techs: ["go"], p_favorite_techs: ["k8s"], p_cv_techs: [], p_goal: "technical", p_brief: "" },
      },
    ]);
  });

  it("surfaces a failed save", async () => {
    const { api } = fake({ rpcError: { message: "boom" } });
    await expect(
      api.savePreparation({ profilePatch: { targetRole: "", goalTechs: [], favoriteTechs: [], cvTechs: [] }, goal: "explore", brief: "" }),
    ).rejects.toThrow("boom");
  });

  it("github signals never send favourites", async () => {
    const { api, rpcs } = fake();
    await api.saveGithubSignals({ acceptedTechs: ["go"], syncedAt: null });
    expect(rpcs[0]).toEqual({ fn: "save_github_signals", args: { p_accepted: ["go"], p_synced_at: null } });
  });

  it("publishes with the generation id and expected active id", async () => {
    const { api, rpcs } = fake({ rpcData: row.active_playbook });
    const result = await api.publishPreparationPlaybook({
      generationId: "g2",
      expectedGenerationId: "g1",
      snapshot: { version: 1 },
      label: "L",
      playbook: { scenario: { name: "n" }, stories: [] },
    });
    expect(rpcs[0].args.p_generation_id).toBe("g2");
    expect(rpcs[0].args.p_expected_generation_id).toBe("g1");
    expect(result).toEqual(row.active_playbook);
  });
});

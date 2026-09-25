// Custom Arch Board scenarios.
import { fail } from "./shared.js";

/** @param {any} supabase */
export function scenariosApi(supabase) {
  const scenarioToUi = (r) => ({
    id: r.id,
    name: r.name,
    brief: r.brief ?? "",
    budget: r.budget,
    checks: r.checks ?? [],
  });

  const scenarioToDb = (s) => ({
    name: s.name,
    brief: s.brief ?? "",
    budget: s.budget,
    checks: s.checks ?? [],
  });

  async function listCustomScenarios() {
    const { data, error } = await supabase.from("custom_scenarios").select("*").order("created_at");
    if (error) fail(error);
    return data.map(scenarioToUi);
  }

  async function upsertCustomScenario(s) {
    const row = scenarioToDb(s);
    const q = s.id
      ? supabase.from("custom_scenarios").update(row).eq("id", s.id)
      : supabase.from("custom_scenarios").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) fail(error);
    return scenarioToUi(data);
  }

  async function deleteCustomScenario(id) {
    const { error } = await supabase.from("custom_scenarios").delete().eq("id", id);
    if (error) fail(error);
  }

  return { listCustomScenarios, upsertCustomScenario, deleteCustomScenario };
}

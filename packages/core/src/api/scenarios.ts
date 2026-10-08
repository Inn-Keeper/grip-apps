// Custom Arch Board scenarios.
import type { Check } from "../arch.js";
import type { CustomScenario, SavedScenario } from "../api";
import { fail, type Db, type Json, type Tables, type TablesInsert } from "./shared";

type ScenarioRow = Pick<Tables<"custom_scenarios">, "id" | "name" | "brief" | "budget" | "checks">;
const SCENARIO_COLUMNS = "id,name,brief,budget,checks";

export function scenariosApi(supabase: Db) {
  const scenarioToUi = (r: ScenarioRow): SavedScenario => ({
    id: r.id,
    name: r.name,
    brief: r.brief ?? "",
    budget: r.budget,
    checks: (r.checks ?? []) as Check[],
  });

  const scenarioToDb = (s: CustomScenario) => ({
    name: s.name,
    brief: s.brief ?? "",
    budget: s.budget,
    checks: (s.checks ?? []) as Json,
  }) satisfies TablesInsert<"custom_scenarios">;

  async function listCustomScenarios(): Promise<SavedScenario[]> {
    const { data, error } = await supabase.from("custom_scenarios").select(SCENARIO_COLUMNS).order("created_at");
    if (error) fail(error);
    return data.map(scenarioToUi);
  }

  async function upsertCustomScenario(s: CustomScenario): Promise<SavedScenario> {
    const row = scenarioToDb(s);
    const q = s.id
      ? supabase.from("custom_scenarios").update(row).eq("id", s.id)
      : supabase.from("custom_scenarios").insert(row);
    const { data, error } = await q.select(SCENARIO_COLUMNS).single();
    if (error) fail(error);
    return scenarioToUi(data);
  }

  async function deleteCustomScenario(id: string): Promise<void> {
    const { error } = await supabase.from("custom_scenarios").delete().eq("id", id);
    if (error) fail(error);
  }

  return { listCustomScenarios, upsertCustomScenario, deleteCustomScenario };
}

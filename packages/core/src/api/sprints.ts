// Skeleton sprint log.
import type { DesignSprint } from "../api";
import { fail, type Db } from "./shared";

// Enough for the trend; older runs stay in the table.
const SPRINT_LIMIT = 50;

export function sprintsApi(supabase: Db) {
  /** The most recent sprints, oldest first. */
  async function listSprints(): Promise<DesignSprint[]> {
    const { data, error } = await supabase
      .from("design_sprints")
      .select("id,scenario_id,seconds,ran_out,hit,total,missed,created_at")
      .order("created_at", { ascending: false })
      .limit(SPRINT_LIMIT);
    if (error) fail(error);
    return data.reverse().map((r) => ({
      id: r.id,
      scenarioId: r.scenario_id,
      seconds: r.seconds,
      ranOut: r.ran_out,
      hit: r.hit,
      total: r.total,
      missed: r.missed,
      createdAt: r.created_at,
    }));
  }

  async function addSprint(s: DesignSprint): Promise<void> {
    const { error } = await supabase.from("design_sprints").insert({
      scenario_id: s.scenarioId,
      seconds: s.seconds,
      ran_out: s.ranOut,
      hit: s.hit,
      total: s.total,
      missed: s.missed,
    });
    if (error) fail(error);
  }

  return { listSprints, addSprint };
}

// STAR stories.
import { fail } from "./shared.js";

/** @param {any} supabase */
export function storiesApi(supabase) {
  const storyToUi = (r) => ({
    id: r.id,
    title: r.title,
    competency: r.competency,
    situation: r.situation ?? "",
    task: r.task ?? "",
    action: r.action ?? "",
    result: r.result ?? "",
    scenarioId: r.scenario_id ?? null,
  });

  const storyToDb = (s) => ({
    title: s.title,
    competency: s.competency,
    situation: s.situation || null,
    task: s.task || null,
    action: s.action || null,
    result: s.result || null,
    // Only when the caller knows about the link, so clients without it (mobile) don't clear it.
    ...(s.scenarioId !== undefined && { scenario_id: s.scenarioId || null }),
  });

  async function listStories() {
    const { data, error } = await supabase.from("stories").select("*").order("created_at");
    if (error) fail(error);
    return data.map(storyToUi);
  }

  async function upsertStory(s) {
    const row = storyToDb(s);
    const q = s.id
      ? supabase.from("stories").update(row).eq("id", s.id)
      : supabase.from("stories").insert(row);
    const { error } = await q;
    if (error) fail(error);
  }

  async function deleteStory(id) {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) fail(error);
  }

  return { listStories, upsertStory, deleteStory };
}

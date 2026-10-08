// STAR stories.
import type { Story } from "../api";
import { fail, type Db, type Tables, type TablesInsert } from "./shared";

type StoryRow = Omit<Tables<"stories">, "user_id" | "created_at" | "updated_at">;

export function storiesApi(supabase: Db) {
  const storyToUi = (r: StoryRow): Story => ({
    id: r.id,
    title: r.title,
    competency: r.competency,
    situation: r.situation ?? "",
    task: r.task ?? "",
    action: r.action ?? "",
    result: r.result ?? "",
    scenarioId: r.scenario_id ?? null,
  });

  const storyToDb = (s: Story) => ({
    title: s.title,
    competency: s.competency,
    situation: s.situation || null,
    task: s.task || null,
    action: s.action || null,
    result: s.result || null,
    // Only when the caller knows about the link, so clients without it (mobile) don't clear it.
    ...(s.scenarioId !== undefined && { scenario_id: s.scenarioId || null }),
  }) satisfies TablesInsert<"stories">;

  async function listStories(): Promise<Story[]> {
    const { data, error } = await supabase.from("stories").select("id,title,competency,situation,task,action,result,scenario_id").order("created_at");
    if (error) fail(error);
    return data.map(storyToUi);
  }

  async function upsertStory(s: Story): Promise<void> {
    const row = storyToDb(s);
    const q = s.id
      ? supabase.from("stories").update(row).eq("id", s.id)
      : supabase.from("stories").insert(row);
    const { error } = await q;
    if (error) fail(error);
  }

  async function deleteStory(id: string): Promise<void> {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) fail(error);
  }

  return { listStories, upsertStory, deleteStory };
}

// Saved Arch Boards and their public share links.
import { normalizeTalkTrack } from "../talkTrack.js";
import { fail } from "./shared.js";

/** @param {any} supabase */
export function boardsApi(supabase) {
  const boardToUi = (r) => ({
    id: r.id,
    title: r.title,
    scenarioId: r.scenario_id,
    storyId: r.story_id ?? null,
    nodes: r.nodes ?? [],
    edges: r.edges ?? [],
    talkTrack: normalizeTalkTrack(r.talk_track),
    talkGrade: Number.isFinite(r.talk_grade) ? r.talk_grade : null,
    shareToken: r.share_token ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  const boardToDb = (b) => ({
    title: b.title,
    scenario_id: b.scenarioId,
    nodes: b.nodes ?? [],
    edges: b.edges ?? [],
    talk_track: normalizeTalkTrack(b.talkTrack),
    talk_grade: Number.isFinite(b.talkGrade) && b.talkGrade >= 0 && b.talkGrade <= 100
      ? Math.round(b.talkGrade)
      : null,
    // Only when the caller knows about the link, so clients without it (mobile) don't clear it.
    ...(b.storyId !== undefined && { story_id: b.storyId || null }),
  });

  const boardSummaryToUi = (r) => ({
    id: r.id,
    title: r.title,
    scenarioId: r.scenario_id,
    storyId: r.story_id ?? null,
    shareToken: r.share_token ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  async function listBoardSummaries() {
    const { data, error } = await supabase
      .from("arch_boards")
      .select("id,title,scenario_id,story_id,share_token,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) fail(error);
    return data.map(boardSummaryToUi);
  }

  async function getBoard(id) {
    const { data, error } = await supabase.from("arch_boards").select("*").eq("id", id).single();
    if (error) fail(error);
    return boardToUi(data);
  }

  async function listBoards() {
    const { data, error } = await supabase.from("arch_boards").select("*").order("updated_at", { ascending: false });
    if (error) fail(error);
    return data.map(boardToUi);
  }

  async function upsertBoard(board) {
    const row = boardToDb(board);
    const q = board.id
      ? supabase.from("arch_boards").update(row).eq("id", board.id)
      : supabase.from("arch_boards").insert(row);
    const { data, error } = await q.select("*").single();
    if (error) fail(error);
    return boardToUi(data);
  }

  async function deleteBoard(id) {
    const { error } = await supabase.from("arch_boards").delete().eq("id", id);
    if (error) fail(error);
  }

  /**
   * Enables or revokes a board's public share link.
   * @param {string} id
   * @param {boolean} enable
   * @returns {Promise<string | null>} the share token when enabled, null when revoked
   */
  async function setBoardSharing(id, enable) {
    const { data, error } = await supabase.rpc("set_board_sharing", { board_id: id, enable });
    if (error) fail(error);
    return data ?? null;
  }

  /**
   * Reads a shared board by its token — works signed out (token-scoped RPC,
   * no open select policy on arch_boards).
   * @param {string} token
   * @returns {Promise<{ title: string, scenarioId: string, nodes: object[], edges: object[], updatedAt: string } | null>}
   */
  async function getSharedBoard(token) {
    const { data, error } = await supabase.rpc("get_shared_board", { token });
    if (error) fail(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      title: row.title,
      scenarioId: row.scenario_id,
      nodes: row.nodes ?? [],
      edges: row.edges ?? [],
      updatedAt: row.updated_at,
    };
  }

  return { listBoards, listBoardSummaries, getBoard, upsertBoard, deleteBoard, setBoardSharing, getSharedBoard };
}

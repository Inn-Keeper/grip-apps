// Saved Arch Boards and their public share links.
import type { BoardEdge, BoardNode } from "../arch.js";
import type { BoardOverview, BoardSummary, SavedBoard, SharedBoard } from "../api";
import { normalizeTalkTrack } from "../talkTrack.js";
import { fail, type Db, type Tables, type TablesInsert } from "./shared";

// Everything the UI maps; user_id stays server-side.
const BOARD_COLUMNS = "id,title,scenario_id,story_id,nodes,edges,talk_track,talk_grade,share_token,created_at,updated_at";
type BoardRow = Omit<Tables<"arch_boards">, "user_id">;
type BoardSummaryRow = Pick<BoardRow, "id" | "title" | "scenario_id" | "story_id" | "share_token" | "created_at" | "updated_at">;

// nodes/edges are jsonb; the board editor owns their shape.
const asNodes = (json: unknown) => (json ?? []) as BoardNode[];
const asEdges = (json: unknown) => (json ?? []) as BoardEdge[];

export function boardsApi(supabase: Db) {
  const boardToUi = (r: BoardRow): SavedBoard => ({
    id: r.id,
    title: r.title,
    scenarioId: r.scenario_id,
    storyId: r.story_id ?? null,
    nodes: asNodes(r.nodes),
    edges: asEdges(r.edges),
    talkTrack: normalizeTalkTrack(r.talk_track),
    talkGrade: Number.isFinite(r.talk_grade) ? r.talk_grade : null,
    shareToken: r.share_token ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  const boardToDb = (b: SavedBoard) => ({
    title: b.title,
    scenario_id: b.scenarioId,
    nodes: b.nodes ?? [],
    edges: b.edges ?? [],
    talk_track: normalizeTalkTrack(b.talkTrack),
    talk_grade: typeof b.talkGrade === "number" && Number.isFinite(b.talkGrade) && b.talkGrade >= 0 && b.talkGrade <= 100
      ? Math.round(b.talkGrade)
      : null,
    // Only when the caller knows about the link, so clients without it (mobile) don't clear it.
    ...(b.storyId !== undefined && { story_id: b.storyId || null }),
  }) satisfies TablesInsert<"arch_boards">;

  const boardSummaryToUi = (r: BoardSummaryRow): BoardSummary => ({
    id: r.id,
    title: r.title,
    scenarioId: r.scenario_id,
    storyId: r.story_id ?? null,
    shareToken: r.share_token ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  async function listBoardSummaries(): Promise<BoardSummary[]> {
    const { data, error } = await supabase
      .from("arch_boards")
      .select("id,title,scenario_id,story_id,share_token,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) fail(error);
    return data.map(boardSummaryToUi);
  }

  async function getBoard(id: string): Promise<SavedBoard> {
    const { data, error } = await supabase.from("arch_boards").select(BOARD_COLUMNS).eq("id", id).single();
    if (error) fail(error);
    return boardToUi(data);
  }

  async function listBoards(): Promise<SavedBoard[]> {
    const { data, error } = await supabase.from("arch_boards").select(BOARD_COLUMNS).order("updated_at", { ascending: false });
    if (error) fail(error);
    return data.map(boardToUi);
  }

  /** Newest first, without talk tracks or share links: for readiness scores and story links. */
  async function listBoardOverviews(): Promise<BoardOverview[]> {
    const { data, error } = await supabase
      .from("arch_boards")
      .select("id,title,scenario_id,story_id,nodes,edges,talk_grade,updated_at")
      .order("updated_at", { ascending: false });
    if (error) fail(error);
    return data.map((r) => ({
      id: r.id,
      title: r.title,
      scenarioId: r.scenario_id,
      storyId: r.story_id,
      nodes: asNodes(r.nodes),
      edges: asEdges(r.edges),
      talkGrade: r.talk_grade,
      updatedAt: r.updated_at,
    }));
  }

  async function upsertBoard(board: SavedBoard): Promise<SavedBoard> {
    const row = boardToDb(board);
    const q = board.id
      ? supabase.from("arch_boards").update(row).eq("id", board.id)
      : supabase.from("arch_boards").insert(row);
    const { data, error } = await q.select(BOARD_COLUMNS).single();
    if (error) fail(error);
    return boardToUi(data);
  }

  async function deleteBoard(id: string): Promise<void> {
    const { error } = await supabase.from("arch_boards").delete().eq("id", id);
    if (error) fail(error);
  }

  /** Enables or revokes a board's public share link; returns the token when enabled, null when revoked. */
  async function setBoardSharing(id: string, enable: boolean): Promise<string | null> {
    const { data, error } = await supabase.rpc("set_board_sharing", { board_id: id, enable });
    if (error) fail(error);
    return data ?? null;
  }

  /** Reads a shared board by its token. Works signed out (token-scoped RPC, no open select policy on arch_boards). */
  async function getSharedBoard(token: string): Promise<SharedBoard | null> {
    const { data, error } = await supabase.rpc("get_shared_board", { token });
    if (error) fail(error);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      title: row.title,
      scenarioId: row.scenario_id,
      nodes: asNodes(row.nodes),
      edges: asEdges(row.edges),
      updatedAt: row.updated_at,
    };
  }

  return { listBoards, listBoardSummaries, listBoardOverviews, getBoard, upsertBoard, deleteBoard, setBoardSharing, getSharedBoard };
}

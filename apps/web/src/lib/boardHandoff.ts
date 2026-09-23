// Hand-off channel from Stories to the Arch Board: Stories writes what to open,
// navigates via the grip:navigate event, and the board picks it up on mount.

const KEY = "grip.boardHandoff";

/** A new board for a story's scenario, or a saved board (boardId) to load. */
export type BoardHandoff = { scenarioId: string; storyId?: string | null; boardId?: string };

export function openInBoard(handoff: BoardHandoff) {
  window.localStorage.setItem(KEY, JSON.stringify(handoff));
  window.dispatchEvent(new CustomEvent("grip:navigate", { detail: "board" }));
}

export function readBoardHandoff(): BoardHandoff | null {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const handoff = JSON.parse(raw) as BoardHandoff;
    return typeof handoff.scenarioId === "string" ? handoff : null;
  } catch {
    return null;
  }
}

export function clearBoardHandoff() {
  window.localStorage.removeItem(KEY);
}

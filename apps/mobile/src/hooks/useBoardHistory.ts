import { useEffect, useRef, useState } from "react";
import { commitSnapshot, createHistory, redo, sameSnapshot, undo } from "@grip/core/boardHistory";
import type { BoardEdge, BoardNode } from "@grip/core/arch";

type Doc = { nodes: BoardNode[]; edges: BoardEdge[] };
type History = { past: Doc[]; present: Doc; future: Doc[] };

// A gesture streams updates; one step is taken once the board settles.
const SETTLE_MS = 300;

// Undo and redo for the board (core's history, shared with web). A new resetKey (another
// board or scenario) starts a fresh history; onRestore puts an undone snapshot back.
export function useBoardHistory(doc: Doc, resetKey: number, onRestore: (doc: Doc) => void) {
  const [history, setHistory] = useState<History>(() => createHistory(doc));
  const keyRef = useRef(resetKey);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (keyRef.current !== resetKey) {
      keyRef.current = resetKey;
      setHistory(createHistory(doc));
      return;
    }
    timer.current = setTimeout(() => setHistory((h) => commitSnapshot(h, doc)), SETTLE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [doc.nodes, doc.edges, resetKey]);

  // Commits a pending change first, so an undo right after a drag undoes that drag.
  const step = (move: typeof undo) => {
    if (timer.current) clearTimeout(timer.current);
    const committed = commitSnapshot(history, doc);
    const next = move(committed);
    // Nothing to step to: leave the board (and its score) alone.
    if (next === committed) return;
    setHistory(next);
    onRestore(next.present);
  };

  // A change still settling; by content, since a gesture can end where it started.
  const pending = !sameSnapshot(history.present, doc);
  return {
    canUndo: history.past.length > 0 || pending,
    canRedo: history.future.length > 0 && !pending,
    undo: () => step(undo),
    redo: () => step(redo),
  };
}

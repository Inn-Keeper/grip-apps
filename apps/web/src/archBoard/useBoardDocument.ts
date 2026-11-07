import { useRef, useState } from "react";
import { commitSnapshot, createHistory, redo, sameSnapshot, undo } from "@grip/core/boardHistory";
import { applyBoardPatch, makeAssessment } from "@grip/core/gradeState";
import type { BoardEdge, BoardNode, TalkAssessment, TalkGradeResult } from "./types";

// Everything a saved board persists. Key order matters: snapshots compare as JSON.
export type BoardDoc = {
  scenarioId: string;
  storyId: string | null;
  nodes: BoardNode[];
  edges: BoardEdge[];
  talkSections: Record<string, string>;
  talkRating: number | null;
  talkGrade: number | null;
  // A free board's own brief; empty on scenario boards.
  brief: string;
  // The detail behind talkGrade, tied to the inputs it graded.
  talkAssessment: TalkAssessment | null;
};

type History = { past: BoardDoc[]; present: BoardDoc; future: BoardDoc[] };

// The board as an undoable document: one state object, its history, and the last saved copy.
// onApply runs whenever a commit, undo or redo replaces the document, with the documents before
// and after, so derived state resets only when what it depends on changed.
export function useBoardDocument(initial: () => BoardDoc, onApply: (prev: BoardDoc, next: BoardDoc) => void) {
  const [doc, setDoc] = useState(initial);
  const history = useRef<History | null>(null);
  const saved = useRef<BoardDoc | null>(null);
  const [, rerender] = useState(0);
  if (!history.current) {
    history.current = createHistory(doc);
    saved.current = doc;
  }

  const apply = (next: History) => {
    const prev = doc;
    history.current = next;
    setDoc(next.present);
    onApply(prev, next.present);
    rerender((value) => value + 1);
  };

  return {
    doc,
    isDirty: !sameSnapshot(doc, saved.current),
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
    // One undo step; no-op when nothing changed. Clears the reasoning grade when what it graded changed.
    commit: (patch: Partial<BoardDoc>) => apply(commitSnapshot({ ...history.current!, present: doc }, applyBoardPatch(doc, patch))),
    undo: () => apply(undo(history.current)),
    redo: () => apply(redo(history.current)),
    // Live drag frames: shown at once, recorded only by recordNodes on drop.
    setNodes: (nodes: BoardNode[]) => setDoc((current) => ({ ...current, nodes })),
    recordNodes: (nodes: BoardNode[]) => {
      history.current = commitSnapshot(history.current, { ...doc, nodes });
      rerender((value) => value + 1);
    },
    // A grade arrives from the server; it dirties the board so Save persists it with its detail.
    // It replaces the present snapshot (no undo step), so undo then redo keeps the grade.
    setAssessment: (result: TalkGradeResult) => {
      const next = { ...doc, talkGrade: result.score, talkAssessment: makeAssessment(doc, result) };
      history.current = { ...history.current!, present: next };
      setDoc(next);
    },
    // Load or start fresh: the new document is both the history root and the saved copy.
    reset: (next: BoardDoc) => {
      history.current = createHistory(next);
      saved.current = next;
      setDoc(next);
    },
    markSaved: (value: BoardDoc) => {
      saved.current = value;
      rerender((n) => n + 1);
    },
  };
}

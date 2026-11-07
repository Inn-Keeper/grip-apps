import { useEffect } from "react";
import { t } from "@grip/core/i18n";
import { useUnsavedGuard } from "../lib/useUnsavedGuard";

type History = { undo: () => void; redo: () => void };

// Guards unsaved work on leave, and wires Escape, the tool letters and undo/redo outside text fields.
export function useBoardShortcuts(history: History, isDirty: boolean, onEscape: () => void, onLetter: (key: string) => void) {
  useUnsavedGuard(isDirty, t("board.discardConfirm"));

  // No deps on purpose: rebinds each render so the handlers never go stale.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editable = event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName));
      if (editable) return;
      if (event.key === "Escape") onEscape();
      if (/^[a-z]$/i.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) onLetter(event.key.toLowerCase());
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) history.redo();
        else history.undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

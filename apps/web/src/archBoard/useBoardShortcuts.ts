import { useEffect } from "react";
import { t } from "@grip/core/i18n";

type History = { undo: () => void; redo: () => void };

// Guards unsaved work on leave, and wires Escape plus undo/redo outside text fields.
export function useBoardShortcuts(history: History, isDirty: boolean, cancelConnection: () => void) {
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const guardNavigation = (event: Event) => { if (!window.confirm(t("board.discardConfirm"))) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("grip:navigate", guardNavigation);
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("grip:navigate", guardNavigation); };
  }, [isDirty]);

  // No deps on purpose: rebinds each render so the handlers never go stale.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const editable = event.target instanceof HTMLElement && (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName));
      if (editable) return;
      if (event.key === "Escape") cancelConnection();
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

import { useEffect } from "react";
import { t } from "@grip/core/i18n";

// Asks the active "grip:navigate" guards whether leaving is fine; false when a dirty form refused.
export const mayLeave = () => window.dispatchEvent(new CustomEvent("grip:navigate", { cancelable: true }));

// While dirty, reload/close warns and tab changes, Back and Cancel ask before discarding.
export function useUnsavedGuard(isDirty: boolean, message: string = t("common.discardConfirm")) {
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const guard = (event: Event) => { if (!window.confirm(message)) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("grip:navigate", guard);
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("grip:navigate", guard); };
  }, [isDirty, message]);
}

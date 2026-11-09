// Hand-off channel for "Drill these in Prep": Quest writes the plan, navigates
// via the grip:navigate event, and Prep picks it up as a banner.

const KEY = "grip.prepPlan";

export type StoredPrepPlan = { name: string; deadline: string; techs: string[] };

export function writePrepPlan(plan: StoredPrepPlan) {
  window.localStorage.setItem(KEY, JSON.stringify(plan));
}

export function readPrepPlan(): StoredPrepPlan | null {
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const plan = JSON.parse(raw) as StoredPrepPlan;
    return Array.isArray(plan.techs) && plan.techs.length > 0 ? plan : null;
  } catch {
    return null;
  }
}

export function clearPrepPlan() {
  window.localStorage.removeItem(KEY);
}

// Set by the first-run wizard: Prep opens as a single focus card until the first drill or "Show full dashboard".
// It keeps the plan's board so the card can link straight to it.
const FOCUS_KEY = "grip.prepFocus";

export type PrepFocus = { scenarioId: string | null; boardId: string | null };

export function startPrepFocus(focus: PrepFocus) {
  window.localStorage.setItem(FOCUS_KEY, JSON.stringify(focus));
}

export function readPrepFocus(): PrepFocus | null {
  const raw = window.localStorage.getItem(FOCUS_KEY);
  if (!raw) return null;
  try {
    const focus = JSON.parse(raw) as Partial<PrepFocus>;
    return { scenarioId: focus.scenarioId ?? null, boardId: focus.boardId ?? null };
  } catch {
    return null;
  }
}

export function endPrepFocus() {
  window.localStorage.removeItem(FOCUS_KEY);
}

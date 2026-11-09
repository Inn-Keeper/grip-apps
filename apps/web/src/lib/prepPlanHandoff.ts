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
const FOCUS_KEY = "grip.prepFocus";

export function startPrepFocus() {
  window.localStorage.setItem(FOCUS_KEY, "1");
}

export function readPrepFocus(): boolean {
  return window.localStorage.getItem(FOCUS_KEY) === "1";
}

export function endPrepFocus() {
  window.localStorage.removeItem(FOCUS_KEY);
}

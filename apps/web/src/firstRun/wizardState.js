// Wizard answers and step order. Pure, so the flow is testable without React.

export const STEPS = ["stack", "goal", "role", "experience", "review", "generate"];

/**
 * @typedef {"technical" | "stories" | "design" | "explore"} Goal
 * @typedef {{ step: string, stack: string[], goal: Goal | "", brief: string, role: string,
 *   jobInput: string, jobText: string, jobTechs: string[], cvText: string, notes: string[] }} WizardState
 */

/** @param {{ favoriteTechs?: string[], goalTechs?: string[], targetRole?: string } | null} profile @returns {WizardState} */
export function initialWizard(profile) {
  return {
    step: "stack",
    // A rerun starts from the last goals; a first run from Profile favorites.
    stack: [...(profile?.goalTechs?.length ? profile.goalTechs : profile?.favoriteTechs ?? [])],
    goal: "",
    brief: "",
    role: profile?.targetRole ?? "",
    jobInput: "",
    jobText: "",
    jobTechs: [],
    cvText: "",
    notes: ["", "", ""],
  };
}

const move = (state, delta) => {
  const i = STEPS.indexOf(state.step) + delta;
  return { ...state, step: STEPS[Math.max(0, Math.min(STEPS.length - 1, i))] };
};

/** @param {WizardState} state @param {any} action @returns {WizardState} */
export function wizardReducer(state, action) {
  switch (action.type) {
    case "toggleTech":
      return {
        ...state,
        stack: state.stack.includes(action.tech) ? state.stack.filter((t) => t !== action.tech) : [...state.stack, action.tech],
      };
    case "setGoal":
      return { ...state, goal: action.goal };
    case "setField":
      return { ...state, [action.field]: action.value };
    case "setNote":
      return { ...state, notes: state.notes.map((note, i) => (i === action.index ? action.value : note)) };
    case "next":
    case "skip":
      return move(state, 1);
    case "back":
      return move(state, -1);
    case "goTo":
      return { ...state, step: action.step };
    default:
      return state;
  }
}

/** Only the goal is required; every other step can be left empty. @param {WizardState} state */
export function canContinue(state) {
  return state.step !== "goal" || state.goal !== "";
}

/** Saved when generation starts. The done flag waits for landing, so the wizard stays up meanwhile. */
export function profileUpdate(state) {
  return { goalTechs: [...new Set([...state.stack, ...state.jobTechs])], targetRole: state.role };
}

// Must match the caps in grip-ai-api app/playbook_schemas.py (stack 30, role 120).
const MAX_STACK = 30;
const MAX_ROLE = 120;

/** The API request, trimmed to its caps so a prefilled profile can never cause a 422. */
export function playbookRequest(state, locale) {
  return {
    stack: state.stack.slice(0, MAX_STACK),
    goal: state.goal || "explore",
    brief: state.brief,
    role: state.role.slice(0, MAX_ROLE),
    job_text: state.jobText,
    cv_text: state.cvText,
    notes: state.notes.filter((n) => n.trim()),
    locale,
  };
}

/** Techs for Prep's plan banner: the stack first, then what the role asks for. */
export function prepPlanTechs(state) {
  return [...new Set([...state.stack, ...state.jobTechs])].slice(0, 8);
}

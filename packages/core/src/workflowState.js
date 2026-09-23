// Where the board is in its journey. Out of the component so it can be tested
// without rendering. Shared by the web rail and the mobile board.

/** Every step, in order, so the rail can show the ones already behind you. */
export const WORKFLOW_STEPS = [
  { step: 1, labelKey: "board.railAdd" },
  { step: 2, labelKey: "board.railConnect" },
  { step: 3, labelKey: "board.railDescribe" },
  { step: 4, labelKey: "board.railExplain" },
  { step: 5, labelKey: "board.railGrade" },
];

/**
 * The step the board is on.
 *
 * The first three come from the drawing itself. The last two are the half the
 * board cannot score: the design is evaluated, then the reasoning behind it is
 * graded. Grading used to sit behind a toolbar toggle, which is why nobody
 * reached it.
 */
export const workflowStep = (nodeCount, edgeCount, evaluated = false, graded = false) =>
  nodeCount === 0 ? 1 : edgeCount === 0 ? 2 : !evaluated ? 3 : !graded ? 4 : 5;

/** done | current | todo, so a finished step stays on screen instead of vanishing. */
export const stepState = (step, activeStep) =>
  step < activeStep ? "done" : step === activeStep ? "current" : "todo";

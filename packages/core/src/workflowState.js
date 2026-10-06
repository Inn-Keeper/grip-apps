// Where the board is in its journey. Out of the component so it can be tested
// without rendering. Shared by the web rail and the mobile board.

import { t } from "./i18n.js";

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

// Next Up's title and line for each step. Touch swaps in the tap wording for steps 1 to 3.
/**
 * @param {{ step: number, connectFromName?: string | null, scenarioName: string, weakestLabel: string, touch?: boolean,
 *   verdict: { covered: number, total: number, weakest?: { section: string, gap: string } | null } | null }} input
 */
export function boardStepCopy({ step, connectFromName = null, scenarioName, verdict, weakestLabel, touch = false }) {
  const sub = (key) => t(touch ? `${key}Touch` : key);
  if (step === 1) return { title: t("board.stepAddTitle"), sub: sub("board.stepAddSub") };
  if (step === 2)
    return {
      title: t("board.stepConnectTitle"),
      sub: connectFromName && !touch ? t("board.stepConnectTarget", { name: connectFromName }) : sub("board.stepConnectSub"),
    };
  if (step === 3) return { title: t("board.stepDescribeTitle"), sub: sub("board.stepDescribeSub") };
  if (step === 4) return { title: t("board.stepExplainTitle"), sub: t("board.stepExplainSub") };
  // The design score stays the one headline (rule 17); coverage is stated in words (rule 19).
  return {
    title: t("board.stepGradedTitle", { scenario: scenarioName }),
    sub: !verdict
      ? t("board.stepGradedSub")
      : verdict.weakest
        ? t("board.stepGradedDiagnosis", { covered: verdict.covered, total: verdict.total, section: weakestLabel, question: verdict.weakest.gap })
        : t("board.stepGradedClear", { total: verdict.total }),
  };
}

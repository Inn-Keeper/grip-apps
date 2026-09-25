import { t } from "@grip/core/i18n";

type Verdict = { covered: number; total: number; weakest?: { section: string; gap: string } | null } | null;

type Input = {
  step: number;
  connectFromName: string | null;
  scenarioName: string;
  verdict: Verdict;
  weakestLabel: string;
};

// Next Up's title and line for each workflow step.
export function boardStepCopy({ step, connectFromName, scenarioName, verdict, weakestLabel }: Input) {
  if (step === 1) return { title: t("board.stepAddTitle"), sub: t("board.stepAddSub") };
  if (step === 2)
    return {
      title: t("board.stepConnectTitle"),
      sub: connectFromName ? t("board.stepConnectTarget", { name: connectFromName }) : t("board.stepConnectSub"),
    };
  if (step === 3) return { title: t("board.stepDescribeTitle"), sub: t("board.stepDescribeSub") };
  if (step === 4) return { title: t("board.stepExplainTitle"), sub: t("board.stepExplainSub") };
  // The design score stays the screen's one headline in the right rail (rule 17);
  // coverage is stated in words instead (rule 19).
  return {
    title: t("board.stepGradedTitle", { scenario: scenarioName }),
    sub: !verdict
      ? t("board.stepGradedSub")
      : verdict.weakest
        ? t("board.stepGradedDiagnosis", { covered: verdict.covered, total: verdict.total, section: weakestLabel, question: verdict.weakest.gap })
        : t("board.stepGradedClear", { total: verdict.total }),
  };
}

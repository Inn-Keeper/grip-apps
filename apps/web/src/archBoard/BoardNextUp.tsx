import { t } from "@grip/core/i18n";
import { colors } from "../lib/tokens";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import type { AugmentedScenario, BoardSummary } from "./types";

type Props = {
  latestBoard: BoardSummary | undefined;
  allScenarios: AugmentedScenario[];
  stepCopy: { title: string; sub: string };
  explaining: boolean;
  offerEvaluation: boolean;
  onEvaluate: () => void;
};

// Next Up for the board: says what to do now. The button itself lives in the
// sticky step rail, so the action has one home at every step.
export function BoardNextUp({ latestBoard, allScenarios, stepCopy, explaining, offerEvaluation, onEvaluate }: Props) {
  if (latestBoard)
    return (
      <NextUpShell
        title={t("board.continueTitle", { title: latestBoard.title })}
        sub={t("board.continueSub", {
          scenario: allScenarios.find((item) => item.id === latestBoard.scenarioId)?.name ?? latestBoard.scenarioId,
          date: new Date(latestBoard.updatedAt).toLocaleDateString(),
        })}
        tone={colors.accent ?? ""}
        actionLabel=""
        onAction={null}
      />
    );
  return (
    <NextUpShell
      title={stepCopy.title}
      sub={stepCopy.sub}
      tone={colors.accent ?? ""}
      actionLabel=""
      onAction={null}
      // Evaluating again is offered only when the main action is something else.
      links={(explaining || offerEvaluation) && <NextUpLink label={t("board.evaluateDesign")} onClick={onEvaluate} withOr={false} />}
    />
  );
}

import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import type { RailAction } from "./WorkflowSteps";
import type { AugmentedScenario, BoardSummary } from "./types";

type Props = {
  latestBoard: BoardSummary | undefined;
  allScenarios: AugmentedScenario[];
  stepCopy: { title: string; sub: string };
  action: RailAction;
  // True when the action sits in the right rail, so the card offers only the links.
  actionInRightRail: boolean;
  explaining: boolean;
  saving: boolean;
  onSave: () => void;
  onEvaluate: () => void;
};

// Next Up for the board: resume the latest saved board, else coach the current step.
export function BoardNextUp({ latestBoard, allScenarios, stepCopy, action, actionInRightRail, explaining, saving, onSave, onEvaluate }: Props) {
  if (latestBoard)
    return (
      <NextUpShell
        title={t("board.continueTitle", { title: latestBoard.title })}
        sub={t("board.continueSub", {
          scenario: allScenarios.find((item) => item.id === latestBoard.scenarioId)?.name ?? latestBoard.scenarioId,
          date: new Date(latestBoard.updatedAt).toLocaleDateString(),
        })}
        tone={colors.accent ?? ""}
        actionLabel={action.label}
        actionIcon={action.icon}
        onAction={action.onClick}
      />
    );
  return (
    <NextUpShell
      title={stepCopy.title}
      sub={stepCopy.sub}
      tone={colors.accent ?? ""}
      actionLabel={action.label}
      actionIcon={action.icon}
      onAction={actionInRightRail ? null : action.onClick}
      disabled={action.disabled}
      links={
        <>
          {/* The leading "or" answers a button beside it. With the action in the
              right rail there is nothing for it to answer. */}
          <NextUpLink label={t("board.orSave")} onClick={onSave} disabled={saving} withOr={!actionInRightRail} />
          {explaining && <NextUpLink label={t("board.evaluateDesign")} onClick={onEvaluate} />}
        </>
      }
    />
  );
}

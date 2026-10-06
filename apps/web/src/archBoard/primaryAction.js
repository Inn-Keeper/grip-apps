// Which main action the board offers: resume a saved board, else follow the workflow step.
export const primaryActionKind = ({ hasLatestBoard, hasWeakest, explaining }) =>
  hasLatestBoard ? "continue" : hasWeakest ? "answer" : explaining ? "explain" : "evaluate";

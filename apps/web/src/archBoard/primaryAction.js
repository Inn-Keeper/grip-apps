// Which main action the board offers: resume a saved board, add a first component to an
// empty scored board, else follow the workflow step. A free board has no scored path.
export const primaryActionKind = ({ hasLatestBoard, hasWeakest, explaining, empty = false, free = false }) =>
  hasLatestBoard ? "continue" : empty && !free ? "add" : hasWeakest ? "answer" : explaining ? "explain" : "evaluate";

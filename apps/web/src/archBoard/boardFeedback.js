// Web coaching only: descriptions guide the next action; checklist scoring stays in core.
export const nextUndescribedEdge = (edges) =>
  edges.find((edge) => !edge.mode || !edge.protocol?.trim()) ?? null;

export function checkTargets(check, nodes, edges) {
  const from = check.from ?? [];
  const to = check.to ?? [];
  const types = check.kind === "edge" ? [...from, ...to] : check.type ?? [];
  const typeById = Object.fromEntries(nodes.map((node) => [node.id, node.type]));
  return {
    nodeIds: nodes.filter((node) => types.includes(node.type)).map((node) => node.id),
    edgeIds: check.kind !== "edge" ? [] : edges.filter((edge) =>
      (from.includes(typeById[edge.from]) && to.includes(typeById[edge.to])) ||
      (check.bidi && to.includes(typeById[edge.from]) && from.includes(typeById[edge.to]))
    ).map((edge) => edge.id),
    missing: check.kind === "edge"
      ? !nodes.some((node) => from.includes(node.type)) || !nodes.some((node) => to.includes(node.type))
      : !nodes.some((node) => types.includes(node.type)),
  };
}

export function evaluationDelta(previous, next) {
  if (!previous) return null;
  const passed = new Map(previous.checks.map((check) => [check.label, check.passed]));
  return {
    scoreChange: next.score - previous.score,
    gained: next.checks.filter((check) => check.passed && passed.get(check.label) === false).map((check) => check.label),
    lost: next.checks.filter((check) => !check.passed && passed.get(check.label) === true).map((check) => check.label),
  };
}

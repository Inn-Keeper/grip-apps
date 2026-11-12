import assert from "node:assert/strict";
import test from "node:test";
import { checkTargets, describeProgress, evaluationDelta, nextUndescribedEdge } from "./boardFeedback.js";

const nodes = [{ id: "api", type: "service" }, { id: "cache", type: "cache" }, { id: "db", type: "nosql" }];
const edges = [{ id: "read", from: "api", to: "cache", mode: "sync", protocol: "Redis (RESP)" }, { id: "store", from: "api", to: "db", mode: "sync" }];

test("guidance finds the arrow missing mode or protocol, accepting explicit unspecified", () => {
  assert.equal(nextUndescribedEdge(edges)?.id, "store");
  assert.equal(nextUndescribedEdge([{ ...edges[1], protocol: "Unspecified" }]), null);
  assert.equal(nextUndescribedEdge([{ ...edges[0], mode: undefined }])?.id, "read");
  assert.equal(nextUndescribedEdge([]), null);
  assert.deepEqual(describeProgress(edges), { n: 2, total: 2 });
});

test("node and property checks target only relevant components", () => {
  assert.deepEqual(checkTargets({ kind: "prop", type: ["nosql"], prop: "replicas" }, nodes, edges), { nodeIds: ["db"], edgeIds: [], missing: false });
  assert.deepEqual(checkTargets({ kind: "node", type: ["cdn", "gateway"] }, nodes, edges), { nodeIds: [], edgeIds: [], missing: true });
});

test("edge targets respect direction and bidirectional alternatives without unrelated arrows", () => {
  const check = { kind: "edge", from: ["cache"], to: ["service"] };
  assert.deepEqual(checkTargets(check, nodes, edges), { nodeIds: ["api", "cache"], edgeIds: [], missing: false });
  assert.deepEqual(checkTargets({ ...check, bidi: true }, nodes, edges), { nodeIds: ["api", "cache"], edgeIds: ["read"], missing: false });
  assert.equal(checkTargets({ ...check, from: ["cdn"] }, nodes, edges).missing, true);
});

test("reevaluation reports earned and lost checks without inventing first-run progress", () => {
  const before = { score: 20, checks: [{ label: "Cache", passed: false }, { label: "Database", passed: true }] };
  const after = { score: 40, checks: [{ label: "Cache", passed: true }, { label: "Database", passed: false }] };
  assert.equal(evaluationDelta(null, after), null);
  assert.deepEqual(evaluationDelta(before, after), { scoreChange: 20, gained: ["Cache"], lost: ["Database"] });
});

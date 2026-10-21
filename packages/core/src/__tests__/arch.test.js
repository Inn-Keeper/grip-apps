import { SCENARIOS, evaluate, meta, nodeLabel, nodeSize, resizeRect, styleOf } from "../arch.js";

const payment = SCENARIOS.find((s) => s.id === "payment");

let nextId = 0;
const node = (type) => ({ id: `n${nextId++}`, type, x: 0, y: 0 });
const edge = (from, to) => ({ id: `${from.id}->${to.id}`, from: from.id, to: to.id });

/**
 * A reference payment architecture that satisfies every check. The ledger
 * declares a partition key because payment stores ~92TB — at that size an
 * undeclared partitioning strategy is itself a finding.
 */
function passingPaymentBoard() {
  const client = node("client");
  const gateway = node("gateway");
  const auth = node("auth");
  const service = node("service");
  const psp = node("psp");
  const queue = node("queue");
  const worker = node("worker");
  const sql = { ...node("sql"), partitionKey: "account_id", replicas: 3 };
  const monitor = node("monitor");
  const nodes = [client, gateway, auth, service, psp, queue, worker, sql, monitor];
  // Call semantics are declared: the provider hop blocks the customer, the
  // ledger write does not. An unlabelled board of this size is itself a finding.
  const edges = [
    { ...edge(client, gateway), mode: "sync" },
    { ...edge(gateway, service), mode: "sync" },
    { ...edge(service, psp), mode: "sync" },
    { ...edge(psp, service), mode: "sync" },
    { ...edge(service, queue), mode: "async" },
    { ...edge(queue, worker), mode: "async" },
    { ...edge(worker, sql), mode: "sync" },
  ];
  return { nodes, edges };
}

describe("evaluate", () => {
  it("scores a complete payment architecture at 100% with no warnings", () => {
    const { nodes, edges } = passingPaymentBoard();
    const result = evaluate(payment, nodes, edges);
    expect(result.score).toBe(100);
    expect(result.warnings).toEqual([]);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("still asks how a 92TB ledger is partitioned, however complete the topology", () => {
    const { nodes, edges } = passingPaymentBoard();
    const unpartitioned = nodes.map((n) => (n.type === "sql" ? { ...n, partitionKey: undefined } : n));
    const result = evaluate(payment, unpartitioned, edges);
    expect(result.score).toBe(100);
    expect(result.warnings.some((w) => w.includes("partition"))).toBe(true);
  });

  it("scores an empty board at 0%", () => {
    const result = evaluate(payment, [], []);
    expect(result.score).toBe(0);
    expect(result.checks.some((check) => check.passed)).toBe(false);
  });

  it("flags a client wired directly to a database", () => {
    const client = node("client");
    const sql = node("sql");
    const result = evaluate(payment, [client, sql], [edge(client, sql)]);
    expect(result.warnings.some((w) => w.includes("client talks directly to a database"))).toBe(true);
  });

  it("flags a queue that nothing consumes", () => {
    const queue = node("queue");
    const result = evaluate(payment, [queue], []);
    expect(result.warnings.some((w) => w.includes("queue with no consumer"))).toBe(true);
  });

  it("honors bidirectional edge checks (worker -> queue also counts)", () => {
    const queue = node("queue");
    const worker = node("worker");
    const result = evaluate(payment, [queue, worker], [edge(worker, queue)]);
    const queueCheck = result.checks.find((check) => check.label.includes("consume from the queue"));
    expect(queueCheck.passed).toBe(true);
  });
});

describe("edge mode warnings", () => {
  const wire = (from, to, extra = {}) => ({ id: `${from.id}->${to.id}`, from: from.id, to: to.id, ...extra });

  it("flags waiting synchronously on a queue", () => {
    const service = node("service");
    const queue = node("queue");
    const worker = node("worker");
    const result = evaluate(payment, [service, queue, worker], [
      wire(service, queue, { mode: "sync" }),
      wire(queue, worker),
    ]);
    expect(result.warnings.some((w) => w.includes("slow function call"))).toBe(true);
  });

  it("accepts an async hand-off to a queue", () => {
    const service = node("service");
    const queue = node("queue");
    const worker = node("worker");
    const result = evaluate(payment, [service, queue, worker], [
      wire(service, queue, { mode: "async" }),
      wire(queue, worker),
    ]);
    expect(result.warnings.some((w) => w.includes("slow function call"))).toBe(false);
  });

  it("asks for call semantics once a board is substantial and none are labelled", () => {
    const chain = Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, type: "service", x: 0, y: 0 }));
    const edges = chain.slice(1).map((n, i) => wire(chain[i], n));
    expect(evaluate(payment, chain, edges).warnings.some((w) => w.includes("synchronous or asynchronous"))).toBe(true);
  });

  it("stays quiet about semantics on a small sketch", () => {
    const a = node("service");
    const b = node("sql");
    expect(evaluate(payment, [a, b], [wire(a, b)]).warnings.some((w) => w.includes("synchronous or asynchronous"))).toBe(false);
  });

  it("stops asking once any connection is labelled", () => {
    const chain = Array.from({ length: 6 }, (_, i) => ({ id: `n${i}`, type: "service", x: 0, y: 0 }));
    const edges = chain.slice(1).map((n, i) => wire(chain[i], n));
    edges[0].mode = "sync";
    expect(evaluate(payment, chain, edges).warnings.some((w) => w.includes("synchronous or asynchronous"))).toBe(false);
  });
});

describe("prop checks", () => {
  const scenario = (check) => ({ id: "p", name: "p", brief: "", checks: [check] });
  const store = (props) => ({ id: "s1", type: "sql", x: 0, y: 0, ...props });

  it("passes when a store declares the required property", () => {
    const s = scenario({ kind: "prop", type: ["sql"], prop: "partitionKey", label: "keyed", points: 100 });
    expect(evaluate(s, [store({ partitionKey: "user_id" })], []).score).toBe(100);
  });

  it("fails when the property is missing, blank, or whitespace", () => {
    const s = scenario({ kind: "prop", type: ["sql"], prop: "partitionKey", label: "keyed", points: 100 });
    for (const props of [{}, { partitionKey: "" }, { partitionKey: "   " }]) {
      expect(evaluate(s, [store(props)], []).score).toBe(0);
    }
  });

  it("ignores the property on a node of the wrong type", () => {
    const s = scenario({ kind: "prop", type: ["nosql"], prop: "partitionKey", label: "keyed", points: 100 });
    expect(evaluate(s, [store({ partitionKey: "user_id" })], []).score).toBe(0);
  });

  it("honors a numeric minimum for replica counts", () => {
    const s = scenario({ kind: "prop", type: ["sql"], prop: "replicas", min: 2, label: "replicated", points: 100 });
    expect(evaluate(s, [store({ replicas: 1 })], []).score).toBe(0);
    expect(evaluate(s, [store({ replicas: 3 })], []).score).toBe(100);
  });

  it("passes when any one of several stores satisfies it", () => {
    const s = scenario({ kind: "prop", type: ["sql"], prop: "partitionKey", label: "keyed", points: 100 });
    const nodes = [store({ id: "a" }), { id: "b", type: "sql", x: 0, y: 0, partitionKey: "tenant_id" }];
    expect(evaluate(s, nodes, []).score).toBe(100);
  });
});

describe("scale-aware store warnings", () => {
  const big = { ...payment, scale: { ...payment.scale, dau: 50_000_000, actionsPerUserPerDay: 100, writesPerUserPerDay: 50 } };

  it("flags an unpartitioned store once the scenario is genuinely large", () => {
    const result = evaluate(big, [node("sql")], []);
    expect(result.warnings.some((w) => w.includes("partition"))).toBe(true);
  });

  it("goes quiet once a partition key is declared", () => {
    const result = evaluate(big, [{ id: "s", type: "sql", x: 0, y: 0, partitionKey: "user_id" }], []);
    expect(result.warnings.some((w) => w.includes("partition"))).toBe(false);
  });

  it("does not nag about partitioning on a small scenario", () => {
    const small = { ...payment, scale: { ...payment.scale, dau: 1000, actionsPerUserPerDay: 2, writesPerUserPerDay: 1 } };
    expect(evaluate(small, [node("sql")], []).warnings.some((w) => w.includes("partition"))).toBe(false);
  });

  it("flags a single-instance store carrying real traffic", () => {
    const result = evaluate(big, [{ id: "s", type: "sql", x: 0, y: 0, partitionKey: "user_id", replicas: 1 }], []);
    expect(result.warnings.some((w) => w.includes("single instance"))).toBe(true);
  });
});

describe("blob storage warning", () => {
  const heavy = { ...payment, scale: { ...payment.scale, payloadKb: 6000 } };

  it("flags multi-megabyte payloads pushed into a database", () => {
    const sql = node("sql");
    const result = evaluate(heavy, [sql], []);
    expect(result.warnings.some((w) => w.includes("Object storage"))).toBe(true);
  });

  it("stays quiet once object storage is on the board", () => {
    const result = evaluate(heavy, [node("sql"), node("blob")], []);
    expect(result.warnings.some((w) => w.includes("Object storage"))).toBe(false);
  });

  it("stays quiet for small payloads that belong in a database", () => {
    const light = { ...payment, scale: { ...payment.scale, payloadKb: 4 } };
    const result = evaluate(light, [node("sql")], []);
    expect(result.warnings.some((w) => w.includes("Object storage"))).toBe(false);
  });

  it("does not fire on a scenario with no scale givens", () => {
    const custom = { id: "c", name: "c", brief: "", checks: [] };
    expect(evaluate(custom, [node("sql")], []).warnings.some((w) => w.includes("Object storage"))).toBe(false);
  });
});

describe("free nodes", () => {
  it("leave the score and warnings untouched, arrows included", () => {
    const { nodes, edges } = passingPaymentBoard();
    const box = node("box");
    const text = node("text");
    const extras = Array.from({ length: 12 }, () => node("box"));
    const before = evaluate(payment, nodes, edges);
    const after = evaluate(payment, [...nodes, box, text, ...extras], [...edges, edge(box, nodes[0]), edge(nodes[0], box)]);
    expect(after.score).toBe(before.score);
    expect(after.warnings).toEqual(before.warnings);
  });

  it("fill style defaults per kind: text at M, a shape at S, a note on amber, a line in muted", () => {
    expect(styleOf(node("text"))).toEqual({ size: "m", color: "text", fill: "none", align: "left", bold: false, dashed: false, heads: "end" });
    expect(styleOf(node("box"))).toMatchObject({ size: "s", align: "center" });
    expect(styleOf({ ...node("box"), shape: "note" })).toMatchObject({ size: "m", fill: "warning", align: "left" });
    expect(styleOf(node("arrow")).color).toBe("textDim");
    expect(styleOf(node("sql"))).toMatchObject({ size: "s", color: "text", fill: "none", align: "center" });
    expect(styleOf({ ...node("text"), style: { bold: true, color: "accent" } })).toMatchObject({ size: "m", bold: true, color: "accent" });
  });

  it("read as their typed label, falling back to the type name", () => {
    expect(nodeLabel({ ...node("box"), label: " Billing " })).toBe("Billing");
    expect(nodeLabel(node("text"))).toBe("Text");
    expect(nodeLabel(node("sql"))).toBe("SQL Database");
  });
});

describe("nodeSize", () => {
  const base = { width: 100, height: 40 };
  it("keeps a resized shape or component's size, else the card", () => {
    expect(nodeSize({ type: "box", w: 200, h: 90 }, base)).toEqual({ width: 200, height: 90 });
    expect(nodeSize({ type: "box" }, base)).toEqual(base);
    expect(nodeSize({ type: "sql", w: 300 }, base)).toEqual({ width: 300, height: 40 });
    expect(nodeSize({ type: "text", w: 300 }, base)).toBe(base);
    expect(nodeSize({ type: "arrow", x: 10, y: 10, x2: 110, y2: 60 }, base)).toEqual({ width: 100, height: 50 });
  });
});

describe("resizeRect", () => {
  it("moves only the dragged sides and stops at the minimum", () => {
    const rect = { x: 100, y: 100, w: 140, h: 64 };
    expect(resizeRect(rect, "se", 20, 10)).toEqual({ x: 100, y: 100, w: 160, h: 74 });
    expect(resizeRect(rect, "w", 20, 0)).toEqual({ x: 120, y: 100, w: 120, h: 64 });
    expect(resizeRect(rect, "nw", 500, 500)).toEqual({ x: 192, y: 132, w: 48, h: 32 });
    expect(resizeRect(rect, "se", -500, -500, { w: 96, h: 40 })).toEqual({ x: 100, y: 100, w: 96, h: 40 });
  });
});

describe("meta", () => {
  it("resolves every palette type to its spec", () => {
    expect(meta("psp").label).toBe("Payment Provider");
  });
});

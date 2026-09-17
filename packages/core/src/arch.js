// Arch Board domain: component palette, scenarios, evaluator.
// Shared by web and mobile — keep free of UI/framework imports.

import { deriveScale } from "./estimation.js";

/**
 * @typedef {object} NodeSpec
 * @property {string} type
 * @property {string} label
 * @property {string} emoji
 * @property {number} cost
 * @property {number} maint
 */

/**
 * Stateful nodes carry the two properties interviewers actually probe: how the
 * data is split, and how many copies exist. Both are optional — boards saved
 * before these existed simply have neither.
 *
 * @typedef {object} BoardNode
 * @property {string} id
 * @property {string} type
 * @property {number} x
 * @property {number} y
 * @property {string} [partitionKey]
 * @property {number} [replicas]
 */

/**
 * Real whiteboards annotate arrows. `mode` is the one that changes the design
 * (a synchronous hop couples two services' availability; an async one doesn't);
 * `protocol` is what an interviewer asks next. Both optional — arrows drawn
 * before these existed carry neither.
 *
 * @typedef {object} BoardEdge
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {"sync" | "async"} [mode]
 * @property {string} [protocol]
 */

/**
 * @typedef {object} Check
 * @property {"node" | "edge" | "prop"} kind
 * @property {string} [prop] for kind "prop": the BoardNode field that must be set
 * @property {number} [min] for numeric props: the smallest passing value
 * @property {string[]} [type]
 * @property {string[]} [from]
 * @property {string[]} [to]
 * @property {boolean} [bidi]
 * @property {string} label
 * @property {number} points
 */

/**
 * @typedef {object} WarningRule
 * @property {(helpers: {
 *   hasNode: (types: string[]) => boolean,
 *   hasEdge: (from: string[], to: string[], bidi?: boolean) => boolean,
 * }) => boolean} when
 * @property {string} text
 */

/**
 * @typedef {object} Scenario
 * @property {string} id
 * @property {string} name
 * @property {string} brief
 * @property {number} budget
 * @property {Check[]} checks
 * @property {WarningRule[]} [warnings]
 * @property {import("./estimation.js").ScenarioScale} [scale] absent on user-authored scenarios
 * @property {string} [pushback] interviewer follow-up; absent on user-authored scenarios
 */

/**
 * @typedef {object} EvalResult
 * @property {(Check & { passed: boolean })[]} checks
 * @property {number} earned
 * @property {number} totalPts
 * @property {number} score
 * @property {number} cost
 * @property {number} maint
 * @property {string[]} warnings
 */

/** @type {NodeSpec[]} */
export const NODE_TYPES = [
  { type: "client", label: "Client", emoji: "📱", cost: 0, maint: 0 },
  { type: "cdn", label: "CDN", emoji: "🌐", cost: 1, maint: 1 },
  { type: "lb", label: "Load Balancer", emoji: "⚖️", cost: 1, maint: 1 },
  { type: "gateway", label: "API Gateway", emoji: "🚪", cost: 2, maint: 2 },
  { type: "auth", label: "Auth Service", emoji: "🔐", cost: 2, maint: 2 },
  { type: "service", label: "Service / API", emoji: "⚙️", cost: 2, maint: 2 },
  { type: "worker", label: "Async Worker", emoji: "🛠️", cost: 2, maint: 2 },
  { type: "queue", label: "Message Queue", emoji: "📨", cost: 2, maint: 2 },
  { type: "cache", label: "Cache (Redis)", emoji: "⚡", cost: 1, maint: 1 },
  { type: "sql", label: "SQL Database", emoji: "🗄️", cost: 2, maint: 2 },
  { type: "nosql", label: "NoSQL DB", emoji: "📦", cost: 2, maint: 2 },
  // Blob is cheap per byte and nearly maintenance-free; a search index and an
  // event log are both operationally heavy, which is the point of the cost gap.
  { type: "blob", label: "Object Storage", emoji: "🪣", cost: 1, maint: 1 },
  { type: "search", label: "Search Index", emoji: "🔎", cost: 2, maint: 3 },
  { type: "stream", label: "Event Stream", emoji: "🌊", cost: 2, maint: 3 },
  { type: "psp", label: "Payment Provider", emoji: "💳", cost: 3, maint: 1 },
  { type: "monitor", label: "Monitoring", emoji: "📊", cost: 1, maint: 1 },
];

/** @type {Record<string, string>} */
// Data-viz ramp: Tailwind-400 weights, no teal (reserved for the brand accent),
// no pure danger-red (reserved for errors). Rules in /DESIGN.md.
export const TYPE_COLORS = {
  client: "#38BDF8", cdn: "#7DD3FC", lb: "#FBBF24", gateway: "#FB923C",
  auth: "#A78BFA", service: "#4ADE80", worker: "#818CF8", queue: "#FACC15",
  cache: "#F472B6", sql: "#94A3B8", nosql: "#A3E635", psp: "#E879F9", monitor: "#C084FC",
  blob: "#A8A29E", search: "#60A5FA", stream: "#FB7185",
};

/**
 * Palette lookup. Board nodes are only ever created from NODE_TYPES,
 * so a miss is a programmer error.
 * @param {string} type
 * @returns {NodeSpec}
 */
export const meta = (type) => NODE_TYPES.find((t) => t.type === type) ?? NODE_TYPES[0];

/** At roughly a megabyte a row, bytes belong in object storage, not a table. */
const LARGE_PAYLOAD_KB = 1000;

/** Call semantics an arrow can declare. */
export const EDGE_MODES = ["sync", "async"];

/** Protocols worth naming out loud; free text is allowed beyond these. */
export const EDGE_PROTOCOLS = ["REST", "gRPC", "GraphQL", "WebSocket", "Kafka", "SQL"];

/** Below this an unlabelled sketch is fine; past it, silence is a gap. */
const SEMANTICS_EDGE_FLOOR = 5;

/** Durable stores whose partitioning and replication an interviewer will probe. */
export const STATEFUL_TYPES = ["sql", "nosql", "search", "stream", "cache", "blob", "queue"];

/**
 * Below these, one well-provisioned box is a legitimate answer and nagging
 * about shards would be teaching premature scaling.
 */
const SHARDING_QPS = 1000;
const SHARDING_STORAGE_GB = 1000;

// The 100-scenario default library lives in scenarios.js; re-exported here so
// both apps keep importing everything board-related from "@grip/core/arch".
export { SCENARIOS, SCENARIO_CATEGORIES } from "./scenarios.js";

/**
 * Compiles a user-authored custom scenario's requirements into evaluator checks.
 * Points are split evenly so every custom scenario scores out of the same scale.
 * @param {string[]} requiredNodes - node types that must be on the board
 * @param {{ from: string, to: string }[]} requiredEdges - connections that must exist
 * @returns {Check[]}
 */
export function buildCustomChecks(requiredNodes, requiredEdges) {
  /** @type {Check[]} */
  const checks = [
    ...requiredNodes.map((type) => ({
      kind: "node",
      type: [type],
      label: `${meta(type).label} is part of the design`,
    })),
    ...requiredEdges.map(({ from, to }) => ({
      kind: "edge",
      from: [from],
      to: [to],
      label: `${meta(from).label} connects to ${meta(to).label}`,
    })),
  ];
  const points = Math.max(1, Math.round(100 / Math.max(1, checks.length)));
  return checks.map((check) => ({ ...check, points }));
}

/**
 * Scores a board against a scenario's checks, budget, and global design rules.
 * @param {Scenario} scenario
 * @param {BoardNode[]} nodes
 * @param {BoardEdge[]} edges
 * @returns {EvalResult}
 */
export function evaluate(scenario, nodes, edges) {
  const typeOf = Object.fromEntries(nodes.map((n) => [n.id, n.type]));
  const hasNode = (types) => nodes.some((n) => types.includes(n.type));
  const hasEdge = (from, to, bidi) =>
    edges.some((e) => {
      const a = typeOf[e.from];
      const b = typeOf[e.to];
      return (from.includes(a) && to.includes(b)) || (bidi && from.includes(b) && to.includes(a));
    });

  /**
   * A property counts as declared when at least one node of a matching type
   * carries it: a non-blank string, or a number at or above `min`.
   */
  const hasProp = (types, prop, min) =>
    nodes.some((n) => {
      if (!types.includes(n.type)) return false;
      const value = n[prop];
      if (typeof value === "number") return Number.isFinite(value) && value >= (min ?? 1);
      return typeof value === "string" && value.trim() !== "";
    });

  const checks = scenario.checks.map((c) => ({
    ...c,
    passed:
      c.kind === "node"
        ? hasNode(c.type)
        : c.kind === "prop"
          ? hasProp(c.type, c.prop, c.min)
          : hasEdge(c.from, c.to, c.bidi),
  }));
  const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.points, 0);
  const totalPts = scenario.checks.reduce((s, c) => s + c.points, 0);

  const cost = nodes.reduce((s, n) => s + meta(n.type).cost, 0);
  const maint = nodes.reduce((s, n) => s + meta(n.type).maint, 0);

  const warnings = [];
  if (cost > scenario.budget)
    warnings.push(`Over budget: cost ${cost} against a budget of ${scenario.budget}. Every box is a monthly bill.`);
  if (nodes.length > 12)
    warnings.push("A lot of moving parts — each one is deploy, patch, and on-call surface for the team.");
  if (hasEdge(["client"], ["sql", "nosql"]))
    warnings.push("The client talks directly to a database — no validation layer, no auth boundary.");
  if (hasNode(["cache"]) && !hasEdge(["service", "worker", "gateway"], ["cache"]))
    warnings.push("A cache that nothing reads is pure cost.");
  if (hasNode(["queue"]) && !hasEdge(["queue"], ["worker", "service"], true))
    warnings.push("A queue with no consumer — messages go in and rot.");
  // Rows this size make backups, replication, and every full scan miserable.
  if (
    scenario.scale?.payloadKb >= LARGE_PAYLOAD_KB &&
    hasNode(["sql", "nosql"]) &&
    !hasNode(["blob"])
  )
    warnings.push(
      `Writes here are ~${Math.round(scenario.scale.payloadKb / 1000)}MB each and they're going into a database. Object storage holds the bytes; the database should hold the pointer.`
    );
  // A buffer you block on gives up the only thing it was bought for.
  if (
    edges.some(
      (e) => e.mode === "sync" && ["queue", "stream"].includes(typeOf[e.to])
    )
  )
    warnings.push(
      "A connection into the buffer is marked synchronous — if the caller waits for it, that queue is just a slow function call."
    );

  if (edges.length >= SEMANTICS_EDGE_FLOOR && !edges.some((e) => e.mode))
    warnings.push(
      "No connection says whether it's synchronous or asynchronous. That choice decides which failures cascade — say it on every hop that matters."
    );

  // Sharding and replication only matter once the numbers say they do, so both
  // of these are gated on the scenario's own scale rather than nagging always.
  if (scenario.scale) {
    const { peakQps, storageGb } = deriveScale(scenario.scale);
    const atScale = peakQps >= SHARDING_QPS || storageGb >= SHARDING_STORAGE_GB;
    const durable = nodes.filter((n) => n.type === "sql" || n.type === "nosql");

    if (atScale && durable.length > 0 && !durable.some((n) => n.partitionKey?.trim()))
      warnings.push(
        "At this volume the data has to be split, but no store declares a partition key. Which column, and what does it make expensive?"
      );

    if (atScale && durable.some((n) => n.replicas === 1))
      warnings.push(
        "A store is on a single instance under real traffic. One machine is one outage and one maintenance window."
      );
  }

  for (const w of scenario.warnings || []) {
    if (w.when({ hasNode, hasEdge })) warnings.push(w.text);
  }

  // A scenario with no scorable checks would divide by zero; treat it as 0%.
  const score = totalPts > 0 ? Math.round((earned / totalPts) * 100) : 0;
  return { checks, earned, totalPts, score, cost, maint, warnings };
}

// Arch Board domain: component palette, scenarios, evaluator.
// Shared by web and mobile — keep free of UI/framework imports.

import { deriveScale } from "./estimation.js";

/**
 * @typedef {object} NodeSpec
 * @property {string} type
 * @property {string} label
 * @property {string} emoji
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
 * @property {string} [label] free shape and text only: what the user typed
 * @property {"rect" | "diamond" | "ellipse" | "note"} [shape] free box only; absent is "rect"
 * @property {number} [w] free box only: its size, set by resizing; absent is the app's card size
 * @property {number} [h]
 * @property {number} [x2] free arrow or line only: its end point; `x`, `y` is the start
 * @property {number} [y2]
 * @property {FreeStyle} [style] free nodes only; absent fields take the defaults in styleOf
 */

/**
 * One style for every free node; each kind uses the fields that fit it.
 * @typedef {object} FreeStyle
 * @property {"s" | "m" | "l" | "xl"} [size] text size
 * @property {"text" | "textDim" | "accent" | "warning" | "danger"} [color] text or line colour, a `colors` token name
 * @property {"none" | "text" | "textDim" | "accent" | "warning" | "danger"} [fill] shape fill as a soft tint; "none" is the card surface
 * @property {"left" | "center" | "right"} [align]
 * @property {boolean} [bold]
 * @property {boolean} [dashed] arrows and lines
 * @property {"end" | "both" | "none"} [heads] arrows and lines; a line is an arrow with "none"
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
 * @property {string[]} warnings
 */

/** @type {NodeSpec[]} */
export const NODE_TYPES = [
  { type: "client", label: "Client", emoji: "📱" },
  { type: "cdn", label: "CDN", emoji: "🌐" },
  { type: "lb", label: "Load Balancer", emoji: "⚖️" },
  { type: "gateway", label: "API Gateway", emoji: "🚪" },
  { type: "auth", label: "Auth Service", emoji: "🔐" },
  { type: "service", label: "Service / API", emoji: "⚙️" },
  { type: "worker", label: "Async Worker", emoji: "🛠️" },
  { type: "queue", label: "Message Queue", emoji: "📨" },
  { type: "cache", label: "Cache (Redis)", emoji: "⚡" },
  { type: "sql", label: "SQL Database", emoji: "🗄️" },
  { type: "nosql", label: "NoSQL DB", emoji: "📦" },
  { type: "blob", label: "Object Storage", emoji: "🪣" },
  { type: "search", label: "Search Index", emoji: "🔎" },
  { type: "stream", label: "Event Stream", emoji: "🌊" },
  { type: "psp", label: "Payment Provider", emoji: "💳" },
  // Video pipeline: encoding is compute-heavy; DRM and ad insertion are usually bought, like a PSP.
  { type: "encoder", label: "Encoder / Transcoder", emoji: "🎞️" },
  { type: "packager", label: "Packager / Origin", emoji: "🎬" },
  { type: "drm", label: "DRM License Server", emoji: "🔑" },
  { type: "ssai", label: "Ad Insertion (SSAI)", emoji: "📺" },
  { type: "adserver", label: "Ad Server", emoji: "📣" },
  { type: "monitor", label: "Monitoring", emoji: "📊" },
];

/** @type {Record<string, string>} */
// Data-viz ramp: Tailwind-400 weights, no teal (reserved for the brand accent),
// no pure danger-red (reserved for errors). Rules in /DESIGN.md.
export const TYPE_COLORS = {
  client: "#38BDF8", cdn: "#7DD3FC", lb: "#FBBF24", gateway: "#FB923C",
  auth: "#A78BFA", service: "#4ADE80", worker: "#818CF8", queue: "#FACC15",
  cache: "#F472B6", sql: "#94A3B8", nosql: "#A3E635", psp: "#E879F9", monitor: "#C084FC",
  blob: "#A8A29E", search: "#60A5FA", stream: "#FB7185",
  encoder: "#34D399", packager: "#FDBA74", drm: "#C4B5FD", ssai: "#FCD34D", adserver: "#F9A8D4",
};

/** Free box and free text: the user's own notes on the board, never graded. */
export const FREE_TYPES = [
  { type: "box", label: "Box", emoji: "▭" },
  { type: "text", label: "Text", emoji: "T" },
  { type: "arrow", label: "Arrow", emoji: "→" },
];

/** Free text and free arrows are notes, not components, so graded arrows never attach to them. */
export const CONNECTABLE_FREE_TYPES = ["box"];

export const TEXT_SIZES = ["s", "m", "l", "xl"];
/** Token names only, so free notes stay inside the palette (DESIGN.md). */
export const TEXT_COLORS = ["text", "textDim", "accent", "warning", "danger"];
export const TEXT_ALIGNS = ["left", "center", "right"];

export const FILL_COLORS = ["none", ...TEXT_COLORS];
export const ARROW_HEADS = ["end", "both", "none"];

/** `font.size` token per size step; card labels (shapes and components) sit one step below free text. */
export const TEXT_FONT_TOKEN = {
  text: { s: "body", m: "title", l: "heading", xl: "display" },
  card: { s: "small", m: "bodyLg", l: "title", xl: "heading" },
};

/** Starting size of a new shape, in board units; resizing changes it from there. */
export const SHAPE_SIZE = {
  rect: { w: 140, h: 64 },
  diamond: { w: 150, h: 100 },
  ellipse: { w: 140, h: 80 },
  note: { w: 170, h: 140 },
};

/** Fill is a soft tint of a token colour: the alpha-concat convention in DESIGN.md. */
export const FILL_ALPHA = "33";

/**
 * A node's size on the board. A resized node (shape or component) keeps its own;
 * a free arrow spans its two points; the rest take the app's card size, `base`.
 * @param {BoardNode} node
 * @param {{ width: number, height: number }} base
 */
export function nodeSize(node, base) {
  // ponytail: assumes the arrow points right and down from x, y; Fit can crop arrows drawn the other way.
  if (node.type === "arrow") return { width: Math.max(1, (node.x2 ?? node.x) - node.x), height: Math.max(1, (node.y2 ?? node.y) - node.y) };
  if (node.type === "text") return base;
  return { width: node.w ?? base.width, height: node.h ?? base.height };
}

/** Smallest a shape can be resized to, so its handles and text stay usable. */
export const MIN_SHAPE = { w: 48, h: 32 };

const PLACE_PADDING = 30;
const PLACE_GAP_X = 23;
const PLACE_GAP_Y = 41;

/**
 * The first free spot for a new node in a grid across the visible board, on web and mobile.
 * `sizeOf` gives each existing node its own size (resized shapes are bigger than a card).
 */
/** @param {(node: any) => { width: number, height: number }} [sizeOf] */
export function findPlacement(nodes, viewport, nodeSize, sizeOf = () => nodeSize) {
  const stepX = nodeSize.width + PLACE_GAP_X;
  const stepY = nodeSize.height + PLACE_GAP_Y;
  const columns = Math.max(1, Math.floor((viewport.width - PLACE_PADDING * 2 + PLACE_GAP_X) / stepX));
  for (let index = 0; ; index += 1) {
    const point = { x: PLACE_PADDING + (index % columns) * stepX, y: PLACE_PADDING + Math.floor(index / columns) * stepY };
    const overlaps = (node) => {
      const size = sizeOf(node);
      return point.x < node.x + size.width && node.x < point.x + nodeSize.width && point.y < node.y + size.height && node.y < point.y + nodeSize.height;
    };
    if (!nodes.some(overlaps)) return point;
  }
}

/** Smallest a component card resizes to: its label still fits. */
export const MIN_CARD = { w: 96, h: 40 };

/**
 * Resizes a node from a corner (or side) handle. Edges on the handle's side move with
 * the pointer; the opposite side stays put, and the size never drops below `min`.
 * @param {{ x: number, y: number, w: number, h: number }} rect
 * @param {string} dir n, s, e, w or a corner like "ne"
 * @param {{ w: number, h: number }} [min] MIN_SHAPE for shapes, MIN_CARD for components
 */
export function resizeRect(rect, dir, dx, dy, min = MIN_SHAPE) {
  let { x, y, w, h } = rect;
  if (dir.includes("e")) w = Math.max(min.w, w + dx);
  if (dir.includes("s")) h = Math.max(min.h, h + dy);
  if (dir.includes("w")) { const next = Math.max(min.w, w - dx); x += w - next; w = next; }
  if (dir.includes("n")) { const next = Math.max(min.h, h - dy); y += h - next; h = next; }
  return { x: Math.max(0, x), y: Math.max(0, y), w, h };
}

/**
 * A node's style with defaults filled in (free nodes, and components styled from the panel). Text starts at M; a shape at S to
 * match the component cards and centred like them, a note at M on an amber fill like a sticky note
 * and left aligned for longer writing;
 * arrows and lines draw in the muted colour, as component arrows do.
 * @param {BoardNode} node
 * @returns {Required<FreeStyle>}
 */
export function styleOf(node) {
  const style = node.style ?? {};
  const note = node.type === "box" && node.shape === "note";
  return {
    size: style.size ?? (node.type === "text" || note ? "m" : "s"),
    color: style.color ?? (node.type === "arrow" ? "textDim" : "text"),
    fill: style.fill ?? (note ? "warning" : "none"),
    align: style.align ?? (node.type === "text" || note ? "left" : "center"),
    bold: style.bold ?? false,
    dashed: style.dashed ?? false,
    heads: style.heads ?? "end",
  };
}

/** @param {string} type */
export const isFreeType = (type) => FREE_TYPES.some((t) => t.type === type);

/**
 * Palette lookup. Board nodes are only ever created from NODE_TYPES or FREE_TYPES,
 * so a miss is a programmer error.
 * @param {string} type
 * @returns {NodeSpec}
 */
export const meta = (type) => NODE_TYPES.find((t) => t.type === type) ?? FREE_TYPES.find((t) => t.type === type) ?? NODE_TYPES[0];

/** What a node reads as: the typed label for free nodes, else the palette name. @param {BoardNode} node */
export const nodeLabel = (node) => (isFreeType(node.type) ? node.label?.trim() || meta(node.type).label : meta(node.type).label);

/**
 * The graded part of a board: free nodes and every arrow touching one are dropped.
 * @param {BoardNode[]} nodes
 * @param {BoardEdge[]} edges
 */
export function designOnly(nodes, edges) {
  const design = nodes.filter((n) => !isFreeType(n.type));
  const ids = new Set(design.map((n) => n.id));
  return { nodes: design, edges: edges.filter((e) => ids.has(e.from) && ids.has(e.to)) };
}

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

/**
 * A board with no scenario: draw anything, no checklist and no design score.
 * The talk track and AI grading still work, against the board's own brief.
 * Saved as scenario_id "free", so no table needs to know about it.
 */
export const FREE_SCENARIO = { id: "free", name: "Free board", brief: "", checks: [] };

/** @param {string | null | undefined} id */
export const isFreeScenario = (id) => id === FREE_SCENARIO.id;

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
 * Scores a board against a scenario's checks and global design rules.
 * @param {Scenario} scenario
 * @param {BoardNode[]} nodes
 * @param {BoardEdge[]} edges
 * @returns {EvalResult}
 */
export function evaluate(scenario, boardNodes, boardEdges) {
  const { nodes, edges } = designOnly(boardNodes, boardEdges);
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

  const warnings = [];
  if (nodes.length > 12)
    warnings.push("A lot of moving parts: each one is deploy, patch, and on-call surface for the team.");
  if (hasEdge(["client"], ["sql", "nosql"]))
    warnings.push("The client talks directly to a database: no validation layer, no auth boundary.");
  if (hasNode(["cache"]) && !hasEdge(["service", "worker", "gateway"], ["cache"]))
    warnings.push("A cache that nothing reads is pure cost.");
  if (hasNode(["queue"]) && !hasEdge(["queue"], ["worker", "service"], true))
    warnings.push("A queue with no consumer: messages go in and rot.");
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
      "A connection into the buffer is marked synchronous. If the caller waits for it, that queue is just a slow function call."
    );

  if (edges.length >= SEMANTICS_EDGE_FLOOR && !edges.some((e) => e.mode))
    warnings.push(
      "No connection says whether it's synchronous or asynchronous. That choice decides which failures cascade. Say it on every hop that matters."
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
  return { checks, earned, totalPts, score, warnings };
}

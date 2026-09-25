// Interviewer pushback: the follow-up questions you get *after* the diagram.
//
// Distinct from the warnings in arch.js, which fire when something is wrong.
// Pushback fires when something is right — the interviewer points at a box you
// drew and asks you to defend it. Drawing a cache is the easy half; saying how
// it's invalidated is the half that gets graded.
//
// Two sources, so all 100 scenarios are covered without 300 hand-written rules:
//   1. Per-node probes, derived from what's actually on the board.
//   2. One scenario-specific question, authored per scenario in scenarios.js.

/** Follow-ups stay short enough to actually answer in a round. */
export const MAX_PUSHBACK = 5;

/**
 * Questions an interviewer asks about a component once you've drawn it.
 * Keyed by palette type in arch.js — every type needs at least one.
 * @type {Record<string, string[]>}
 */
export const NODE_PROBES = {
  client: [
    "What happens on a flaky mobile network? Where do you retry, and how do you avoid duplicate writes?",
    "How much of this works offline, and what reconciles when the client comes back?",
  ],
  cdn: [
    "What's cacheable here, and how do you purge it when content changes?",
    "What's your cache-hit ratio target, and what does origin traffic look like if you miss it?",
  ],
  lb: [
    "Health checks: how fast do you pull a bad instance, and what does a slow-but-alive one do to you?",
    "Do you need sticky sessions here, and what breaks if an instance disappears mid-request?",
  ],
  gateway: [
    "Where does rate limiting live, and what does a client see when it trips?",
    "The gateway is now a single point of failure. What's your answer when it's down?",
  ],
  auth: [
    "Token or session, and how do you revoke access before it expires naturally?",
    "Every request now depends on auth being up. How do you keep it off the critical path?",
  ],
  service: [
    "This is stateless, so what happens to an in-flight request when you deploy mid-flight?",
    "What's your timeout to downstream, and what do you return when it's exceeded?",
  ],
  worker: [
    "The worker crashes halfway through a job. Does that job run twice, or not at all?",
    "How do you keep one slow tenant's backlog from starving everyone else's?",
  ],
  queue: [
    "At-least-once or exactly-once, and how do consumers stay idempotent either way?",
    "What's your dead-letter policy, and who finds out when the queue backs up?",
  ],
  cache: [
    "What's your invalidation strategy, and what's the TTL?",
    "What hits the database the moment this cache restarts cold?",
  ],
  sql: [
    "What's the partition key, and which query does it make expensive?",
    "How stale can a read replica be before it's a correctness problem here?",
  ],
  nosql: [
    "What access pattern did you pick this key for, and which query does it now make impossible?",
    "What's your consistency model, and where does eventual consistency become visible to a user?",
  ],
  psp: [
    "The provider times out after taking the money. How does the user's next retry not double-charge them?",
    "What's your answer when this third party is down for an hour?",
  ],
  blob: [
    "How does a client actually get the bytes: through your service, or a pre-signed URL straight to storage?",
    "What's your lifecycle policy, and when does old data stop being instantly retrievable?",
  ],
  search: [
    "The index and the source of truth disagree. Which one is right, and how do you reconcile them?",
    "How far behind can the index be before a user notices they can't find what they just created?",
  ],
  stream: [
    "Why a log rather than a queue here? Who needs to replay, and how far back?",
    "What's your partition key, and what happens to ordering when one partition gets hot?",
  ],
  encoder: [
    "What does your ABR ladder look like, and which rung does a viewer on a train actually get?",
    "The encoder for a live channel dies. How many seconds until a standby is on air, and what do viewers see?",
  ],
  packager: [
    "Do you package HLS and DASH ahead of time or just in time, and what does that cost in storage versus CPU?",
    "A million players request the same live manifest every two seconds. What stops that reaching origin?",
  ],
  drm: [
    "The license server is slow at kickoff. Does playback wait, and how long is a license valid once issued?",
    "How do you cover Widevine, FairPlay and PlayReady without three separate pipelines?",
  ],
  ssai: [
    "Stitched ads make every viewer's manifest unique. What happens to your CDN hit rate?",
    "The ad decision server times out. What plays in the break?",
  ],
  adserver: [
    "Ten thousand players ask for ads at the same second when a break starts. What does the ad server see, and what do you prefetch?",
    "The ad server returns nothing for a break. What does the viewer watch instead?",
  ],
  monitor: [
    "Which metric pages someone at 3am, and which one just goes on a dashboard?",
    "What's the SLO here, and how would you know you'd broken it before a customer told you?",
  ],
};

/**
 * Follow-up questions for a finished board: the scenario's own challenge plus
 * probes on the components drawn. Deterministic — the same board always draws
 * the same questions, so the drill is repeatable.
 *
 * The scenario question is prepended and the cap applied afterwards, so it
 * always survives on a board dense enough to trim the rest.
 *
 * @param {{ pushback?: string }} scenario
 * @param {{ type: string }[]} nodes
 * @returns {string[]}
 */
export function buildPushback(scenario, nodes = []) {
  const placed = [...new Set(nodes.map((n) => n.type))];
  const probes = placed.flatMap((type) => NODE_PROBES[type] ?? []);
  const questions = [scenario?.pushback, ...probes].filter(
    (question) => typeof question === "string" && question.trim() !== ""
  );
  return [...new Set(questions)].slice(0, MAX_PUSHBACK);
}

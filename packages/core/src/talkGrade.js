// Client for grip-ai-api, which grades the talk track — the reasoning written
// alongside a diagram. The board already scores topology deterministically in
// arch.js; this covers the half a diagram cannot show.
//
// The facts below are derived HERE and sent with the request. The service does
// not re-derive them: a second implementation of the arithmetic in Python would
// drift from estimation.js with no way to know which was right. The tradeoff is
// that a caller can send facts that flatter its own answer, which is acceptable
// for personal interview prep and not acceptable if anyone else reads the grade.

import { deriveScale } from "./estimation.js";
import { TALK_TRACK_SECTIONS } from "./talkTrack.js";

/** ScenarioFacts caps every list at 40 entries. */
const MAX_FACT_LIST = 40;

export class TalkGradeError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, status?: number, requestId?: string, cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "TalkGradeError";
    /** Service error code, e.g. "nothing_to_grade". Drives the message shown. */
    this.code = options.code ?? "provider_error";
    this.status = options.status;
    this.requestId = options.requestId;
  }
}

/**
 * Assembles the ground truth the grader checks the candidate's numbers against.
 *
 * @param {object} scenario the active scenario, including its `scale` block
 * @param {{ type: string, partitionKey?: string }[]} nodes what is on the board
 * @param {{ checks: { label: string, passed: boolean }[] }} result `evaluate()` output
 */
export function buildGradeFacts(scenario, nodes = [], result) {
  const derived = deriveScale(scenario.scale ?? {});
  const labelsWhere = (passed) =>
    result.checks
      .filter((check) => check.passed === passed)
      .map((check) => check.label)
      .slice(0, MAX_FACT_LIST);

  return {
    scenario_id: scenario.id,
    name: scenario.name,
    brief: scenario.brief,
    dau: scenario.scale?.dau ?? 0,
    payload_kb: scenario.scale?.payloadKb ?? 0,
    retention_days: scenario.scale?.retentionDays ?? 0,
    peak_qps: derived.peakQps,
    storage_gb: derived.storageGb,
    checks_passed: labelsWhere(true),
    checks_failed: labelsWhere(false),
    node_types: [...new Set(nodes.map((node) => node.type))].slice(0, MAX_FACT_LIST),
    partition_keys: nodes
      .map((node) => node.partitionKey?.trim())
      .filter(Boolean)
      .slice(0, MAX_FACT_LIST),
    pushback: scenario.pushback ?? "",
  };
}

/** Every section the service expects, blanks included. */
export function gradeSections(sections = {}) {
  return Object.fromEntries(
    TALK_TRACK_SECTIONS.map(({ id }) => [id, sections[id] ?? ""])
  );
}

/**
 * Binds the grading endpoint to a token provider, mirroring createPipelineApi.
 *
 * `getToken` runs before every request so the token stays fresh — Supabase
 * rotates session tokens on refresh.
 *
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl e.g. "http://localhost:8000"
 */
export function createTalkGradeApi(getToken, baseUrl) {
  if (typeof getToken !== "function") {
    throw new TalkGradeError("talkGrade: getToken must be a function");
  }
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new TalkGradeError("talkGrade: baseUrl is required");
  }
  const base = baseUrl.trim().replace(/\/$/, "");
  const url = `${base}/api/v1/ai/grade-talk-track`;

  /**
   * Whether grading would go through right now. The service answers from its
   * own memory of the last rate limit, so asking costs no provider quota and
   * needs no token. Google exposes no remaining-quota figure, so "available"
   * means "nothing has told us otherwise yet", not "there is quota left".
   *
   * @param {{ signal?: AbortSignal }} [options]
   * @returns {Promise<{ grading: "available" | "unavailable", code?: string,
   *   message?: string, retry_after?: number }>}
   */
  async function getGradingStatus({ signal } = {}) {
    let response;
    try {
      response = await fetch(`${base}/api/v1/ai/status`, { signal });
    } catch (cause) {
      if (cause?.name === "AbortError") throw cause;
      throw new TalkGradeError("talkGrade: the grading service is unreachable", {
        code: "provider_unavailable",
        cause,
      });
    }
    if (!response.ok) {
      throw new TalkGradeError("talkGrade: the grading service is unreachable", {
        code: "provider_unavailable",
        status: response.status,
      });
    }
    return response.json();
  }

  /**
   * @param {object} args
   * @param {string} args.boardId
   * @param {object} args.facts from buildGradeFacts
   * @param {Record<string, string>} args.sections
   * @param {number | null} [args.selfRating]
   * @param {AbortSignal} [args.signal]
   */
  async function gradeTalkTrack({ boardId, facts, sections, selfRating = null, signal }) {
    const token = await getToken();
    if (!token) {
      throw new TalkGradeError("talkGrade: no auth token, user must be signed in", {
        code: "authentication_required",
      });
    }

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          board_id: boardId,
          facts,
          sections: gradeSections(sections),
          self_rating: selfRating,
        }),
      });
    } catch (cause) {
      // An aborted request is the caller changing its mind, not a failure.
      if (cause?.name === "AbortError") throw cause;
      throw new TalkGradeError("talkGrade: the grading service is unreachable", {
        code: "provider_unavailable",
        cause,
      });
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = payload?.error ?? {};
      throw new TalkGradeError(error.message ?? "talkGrade: the request failed", {
        code: error.code,
        status: response.status,
        requestId: error.request_id,
      });
    }
    return payload;
  }

  return { gradeTalkTrack, getGradingStatus };
}

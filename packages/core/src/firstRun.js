// First-run wizard helpers: CV redaction before anything leaves the browser,
// the playbook client for grip-ai-api, and saving the generated playbook.
import { NODE_TYPES } from "./arch.js";
import { t } from "./i18n.js";
import { COMPETENCIES } from "./stories.js";

/** Must match the caps in grip-ai-api app/playbook_schemas.py. */
export const FIRST_RUN_LIMITS = { brief: 500, role: 120, jobText: 4000, cvText: 3000, notes: 3, note: 500 };

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const URL = /\b(?:https?:\/\/|www\.)\S+|\b(?:linkedin|github)\.com\/\S*/gi;
// 9+ digits so year ranges like 2019-2023 (8 digits) survive.
const PHONE = /\+?\(?\d[\d\s().-]{7,}\d/g;
const STREET = /\p{L}*(?:gatan|gata|vägen|väg)\b|\b(?:street|st\.|road|rd\.|avenue|ave\.?|rua|avenida)(?=\s|,|$)/iu;

/**
 * Removes contact details and the user's own name from CV text. The editable
 * preview after this is the real safeguard; regexes miss things.
 * @param {string} text
 * @param {string} displayName
 */
export function redactCv(text, displayName) {
  let out = text
    .replace(EMAIL, "[email]")
    .replace(URL, "[link]")
    .replace(PHONE, (m) => ((m.match(/\d/g) ?? []).length >= 9 ? "[phone]" : m));
  out = out
    .split("\n")
    .map((line) => (/\d/.test(line) && STREET.test(line) ? "[address]" : line))
    .join("\n");
  for (const part of (displayName ?? "").split(/\s+/).filter((p) => p.length >= 3)) {
    const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, "giu"), "[name]");
  }
  return out;
}

/** @param {"technical" | "stories" | "design" | "explore"} goal */
export function landingFor(goal) {
  if (goal === "stories") return "stories";
  if (goal === "design") return "board";
  return "prep";
}

/** @param {{ role?: string, goal: string }} input */
export function playbookLabel({ role, goal }) {
  return role?.trim() || t(`firstRun.goal.${goal}`);
}

export class PlaybookError extends Error {
  /** @param {string} message @param {{ code?: string, status?: number, retryAfter?: number | null }} [options] */
  constructor(message, options = {}) {
    super(message);
    this.name = "PlaybookError";
    this.code = options.code ?? "provider_error";
    this.status = options.status;
    this.retryAfter = options.retryAfter ?? null;
  }
}

/**
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl
 */
export function createPlaybookApi(getToken, baseUrl) {
  const url = `${baseUrl.trim().replace(/\/$/, "")}/api/v1/ai/first-run/playbook`;

  /** @param {object} input wizard answers in the API's snake_case shape @param {{ signal?: AbortSignal }} [options] */
  async function generatePlaybook(input, { signal } = {}) {
    const token = await getToken();
    if (!token) throw new PlaybookError("You need to be signed in.", { code: "authentication_required" });
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...input, competencies: COMPETENCIES, node_types: NODE_TYPES.map((n) => n.type) }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after")) || null;
      throw new PlaybookError(body?.error?.message ?? "Could not write your playbook.", {
        code: body?.error?.code,
        status: response.status,
        retryAfter,
      });
    }
    return body;
  }

  return { generatePlaybook };
}

/** The API's check, trimmed to the fields arch.js reads for its kind. */
const toCheck = ({ kind, type, from, to, label, points }) =>
  kind === "node" ? { kind, type, label, points } : { kind, from, to, label, points };

/**
 * @param {{ stories: Array<{ title: string, technical: boolean } & Record<string, unknown>>, scenario: { name: string, brief: string, checks: any[] } }} playbook
 * @param {{ label: string, upsertCustomScenario: (s: any) => Promise<{ id?: string }>, upsertStory: (s: any) => Promise<unknown> }} deps
 * @param {{ scenarioId: string | null, saved: string[] }} [progress]
 * @returns {Promise<{ scenarioId: string | null, saved: string[], failed: string[] }>}
 * Saves the scenario, then each story. Pass the returned progress back in to
 * retry: the scenario is never created twice and saved stories are skipped.
 */
export async function savePlaybook(playbook, { label, upsertCustomScenario, upsertStory }, progress = { scenarioId: null, saved: [] }) {
  let { scenarioId } = progress;
  if (!scenarioId) {
    const { name, brief, checks } = playbook.scenario;
    scenarioId = (await upsertCustomScenario({ name, brief, checks: checks.map(toCheck) })).id ?? null;
  }
  const saved = [...progress.saved];
  const failed = [];
  for (const { technical, ...story } of playbook.stories) {
    if (saved.includes(story.title)) continue;
    try {
      await upsertStory({ ...story, scenarioId: technical ? scenarioId : null, isSample: true, playbook: label });
      saved.push(story.title);
    } catch {
      failed.push(story.title);
    }
  }
  return { scenarioId, saved, failed };
}

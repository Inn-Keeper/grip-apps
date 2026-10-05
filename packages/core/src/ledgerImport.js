// Ledger import: grip-ai-api parses a messy list of applications, the user reviews
// the rows, and the confirmed ones are saved as Quest contacts in one request.
import { dateToUi } from "./api/shared.js";

const normalize = (name) => (name ?? "").trim().toLowerCase();

/**
 * One parsed row (snake_case, ISO dates) in the UI contact shape upsertContact and
 * importContacts expect (camelCase, DD-MM-YYYY).
 * @param {any} row from POST /api/v1/ai/import/parse
 * @param {string} id client id, stable across retries so a resend cannot duplicate
 */
export function importRowToContact(row, id) {
  return {
    id,
    name: row.name,
    role: row.role ?? "",
    status: row.status,
    date: dateToUi(row.date),
    stageReachedOn: dateToUi(row.stage_date),
    nextAction: row.next_action ?? "",
    nextActionDate: dateToUi(row.next_action_date),
    link: row.link ?? "",
    note: row.note ?? "",
    postingTechs: [],
  };
}

/**
 * Ids of rows whose name is already in Quest or appeared earlier in the import.
 * @param {{ id: string, name: string }[]} rows
 * @param {{ name: string }[]} contacts
 */
export function markDuplicates(rows, contacts) {
  const seen = new Set(contacts.map((c) => normalize(c.name)));
  const duplicates = new Set();
  for (const row of rows) {
    const key = normalize(row.name);
    if (seen.has(key)) duplicates.add(row.id);
    seen.add(key);
  }
  return duplicates;
}

/** Counts for the confirm dialog. @param {{ included: boolean, nextActionDate: string }[]} rows */
export function importSummary(rows) {
  const included = rows.filter((row) => row.included);
  return {
    importing: included.length,
    missingFollowUp: included.filter((row) => !row.nextActionDate).length,
    skipped: rows.length - included.length,
  };
}

export class LedgerImportError extends Error {
  /** @param {string} message @param {{ code?: string, status?: number }} [details] */
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = "LedgerImportError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Binds the parse endpoint to a token provider, like createTalkGradeApi.
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl
 */
export function createLedgerImportApi(getToken, baseUrl) {
  const url = `${baseUrl.trim().replace(/\/$/, "")}/api/v1/ai/import/parse`;

  /**
   * @param {{ text: string } | { filename: string, content_base64: string }} payload
   * @param {{ signal?: AbortSignal }} [options]
   */
  async function parseLedger(payload, { signal } = {}) {
    const token = await getToken();
    if (!token) throw new LedgerImportError("You need to be signed in to import.", { code: "authentication_required" });
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } catch (cause) {
      if (cause?.name === "AbortError") throw cause;
      throw new LedgerImportError("The import service is unreachable.", { code: "provider_unavailable" });
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = body?.error ?? {};
      throw new LedgerImportError(error.message ?? "The import failed.", { code: error.code, status: response.status });
    }
    return body;
  }

  return { parseLedger };
}

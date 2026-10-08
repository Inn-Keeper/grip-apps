import { formatDDMMYYYY, parseDDMMYYYY } from "./contacts.js";
import { markDuplicates } from "./duplicates.js";
import { importRowToContact } from "./ledgerImport.js";
import { linksToRead, mergeTechs } from "./postingReader.js";

/** @typedef {import('./api').Contact & { id: string, stageReachedOn: string, included: boolean, source: string, warnings: string[], linkStatus?: string }} ReviewRow */

export const IMPORT_MAX_BYTES = 1_000_000;
export const IMPORT_FILE_TYPES = /\.(docx|md)$/i;
const EDITABLE_WARNINGS = new Set([
  "missing_name",
  "missing_role",
  "missing_next_action_date",
  "invalid_follow_up",
  "duplicate",
  "possibleDuplicate",
]);

/** Recompute editable warnings without overriding the person's inclusion choices.
 * @template {ReviewRow} R
 * @param {R[]} rows
 * @param {import('./api').Contact[]} contacts
 * @returns {R[]}
 */
export function reviewImportRows(rows, contacts) {
  const duplicates = markDuplicates(rows, contacts);
  return rows.map((row) => {
    const warnings = row.warnings.filter((warning) => !EDITABLE_WARNINGS.has(warning));
    if (!row.name.trim()) warnings.push("missing_name");
    if (!row.role.trim()) warnings.push("missing_role");
    if (!row.nextActionDate) warnings.push("missing_next_action_date");
    else {
      const date = parseDDMMYYYY(row.nextActionDate);
      if (!date || formatDDMMYYYY(date) !== row.nextActionDate) warnings.push("invalid_follow_up");
    }
    const duplicate = duplicates.get(row.id);
    if (duplicate) warnings.push(duplicate === "duplicate" ? "duplicate" : "possibleDuplicate");
    return { ...row, warnings };
  });
}

/** @param {ReviewRow[]} rows */
export const hasInvalidImportRows = (rows) =>
  rows.some(
    (row) =>
      row.included && row.warnings.some((warning) => warning === "missing_name" || warning === "invalid_follow_up"),
  );

/** Both clients finish enrichment before review, so the confirmed data stays still.
 * @param {{ ledger: ReturnType<import('./ledgerImport.js').createLedgerImportApi>, posting: ReturnType<import('./postingReader.js').createPostingReaderApi> | null, payload: { text: string } | { filename: string, content_base64: string }, contacts: import('./api').Contact[], readLinks: boolean, signal: AbortSignal, newId: () => string, onReadingLinks?: () => void }} options
 * @returns {Promise<{ rows: ReviewRow[], unplaced: string[] }>}
 */
export async function readImport({ ledger, posting, payload, contacts, readLinks, signal, newId, onReadingLinks }) {
  const checkAbort = () => {
    if (signal.aborted) throw Object.assign(new Error("Import cancelled"), { name: "AbortError" });
  };
  const result = await ledger.parseLedger(payload, { signal });
  checkAbort();
  let rows = reviewImportRows(
    result.rows.map((row) => ({
      ...importRowToContact(row, newId()),
      included: true,
      source: row.source,
      warnings: row.warnings,
    })),
    contacts,
  );
  rows = rows.map((row) => ({ ...row, included: !row.warnings.includes("duplicate") }));
  const urls = readLinks ? linksToRead(rows, 10) : [];
  if (posting && urls.length) {
    onReadingLinks?.();
    try {
      rows = mergeTechs(rows, await posting.readPostings(urls, { signal }));
    } catch (error) {
      checkAbort();
      if (error.name === "AbortError") throw error;
      rows = rows.map((row) => (urls.includes(row.link) ? { ...row, linkStatus: "unreachable" } : row));
    }
  }
  checkAbort();
  return { rows, unplaced: result.unplaced };
}

/** @param {{ code?: string }} error */
export function importErrorKey(error) {
  const keys = /** @type {const} */ ({
    unsupported_file: "quest.importWrongType",
    file_too_large: "quest.importTooBig",
    ledger_too_long: "quest.importTooLong",
    provider_quota_exhausted: "quest.importBusy",
    provider_limited: "quest.importBusy",
    authentication_required: "quest.importSignIn",
  });
  return keys[error.code] ?? "quest.importFailed";
}

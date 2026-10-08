// Posting link techs for import review: grip-ai-api returns page text, techs are
// detected here so the catalog stays in one place.
import { extractTechsFromText } from "./techMatch.js";
import { PREP_TECHS } from "./prepData.js";
import { LedgerImportError } from "./ledgerImport.js";

const ROW_TECH_LIMIT = 5;

/** @param {string} text */
export function techsFromPage(text) {
  return extractTechsFromText(text, PREP_TECHS, ROW_TECH_LIMIT).map((d) => d.tech);
}

/**
 * Links still to read: included rows not read yet, so re-checking the box resumes
 * instead of spending the rate limit again.
 * @param {{ included: boolean, link: string, linkStatus?: string }[]} rows
 * @param {number} max
 */
export function linksToRead(rows, max) {
  return [...new Set(rows.filter((row) => row.included && row.link && !row.linkStatus).map((row) => row.link))].slice(0, max);
}

/**
 * Fills each row's techs from its posting: page techs first, then the model's.
 * Rows the user edited by hand keep their techs.
 * @template {{ link: string, postingTechs: string[], techsEdited?: boolean, linkStatus?: string }} R
 * @param {R[]} rows
 * @param {{ url: string, status: string, text: string | null }[]} postings
 * @returns {R[]}
 */
export function mergeTechs(rows, postings) {
  const byUrl = new Map(postings.map((p) => [p.url, p]));
  return rows.map((row) => {
    const posting = byUrl.get(row.link);
    if (!posting || row.techsEdited) return row;
    const page = posting.status === "ok" ? techsFromPage(posting.text ?? "") : [];
    const postingTechs = [...new Set([...page, ...row.postingTechs])].slice(0, ROW_TECH_LIMIT);
    return { ...row, postingTechs, linkStatus: posting.status };
  });
}

/**
 * Binds the postings endpoint to a token provider, like createLedgerImportApi.
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl
 */
export function createPostingReaderApi(getToken, baseUrl) {
  const url = `${baseUrl.trim().replace(/\/$/, "")}/api/v1/ai/import/postings`;

  /** @param {string[]} urls @param {{ signal?: AbortSignal }} [options] */
  async function readPostings(urls, { signal } = {}) {
    const token = await getToken();
    if (!token) throw new LedgerImportError("You need to be signed in.", { code: "authentication_required" });
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ urls }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new LedgerImportError(body?.error?.message ?? "Could not read the links.", { code: body?.error?.code, status: response.status });
    return body.postings;
  }

  return { readPostings };
}

import createClient from "openapi-fetch";

/**
 * @typedef {import("./pipeline-types.d.ts").components["schemas"]["VelocityReport"]} VelocityReport
 */

export class PipelineApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, statusText?: string, path?: string, cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "PipelineApiError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.path = options.path;
  }
}

/**
 * Binds the grip-pipeline-service velocity endpoint to a token provider.
 *
 * Types are derived from the live OpenAPI spec via `openapi-typescript`.
 * Re-run `pnpm --filter @grip-apps/core generate:pipeline` whenever the
 * Java service spec changes.
 *
 * `getToken` is called before every request so the token stays fresh (Supabase
 * rotates session tokens on refresh).
 *
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl - e.g. "http://localhost:8080"
 */
export function createPipelineApi(getToken, baseUrl) {
  if (typeof getToken !== "function") {
    throw new PipelineApiError("pipeline: getToken must be a function");
  }
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new PipelineApiError("pipeline: baseUrl is required");
  }

  /** @type {import("openapi-fetch").Client<import("./pipeline-types.d.ts").paths>} */
  const client = createClient({ baseUrl: baseUrl.trim() });

  async function authHeaders() {
    const token = await getToken();
    if (!token) throw new PipelineApiError("pipeline: no auth token — user must be signed in");
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * @param {"/api/pipeline/velocity"} path
   * @returns {Promise<VelocityReport>}
   */
  async function get(path) {
    const { data, error, response } = await client.GET(path, {
      headers: await authHeaders(),
    });
    if (error) {
      throw new PipelineApiError(`pipeline: GET ${path} failed`, {
        status: response?.status,
        statusText: response?.statusText,
        path,
        cause: error,
      });
    }
    return data;
  }

  async function getVelocity() {
    return get("/api/pipeline/velocity");
  }

  return { getVelocity };
}

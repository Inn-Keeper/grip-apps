// Client for the Poe guide chat in grip-ai-api. Stateless: the caller keeps the
// conversation and sends it with every question.

/** Mirrors USER_CHARS and MAX_TURNS in grip-ai-api app/poe_schemas.py. */
export const POE_LIMITS = { userChars: 500, maxTurns: 20 };

export class PoeChatError extends Error {
  /** @param {string} message @param {{ code?: string, status?: number, retryAfter?: number | null }} [options] */
  constructor(message, options = {}) {
    super(message);
    this.name = "PoeChatError";
    this.code = options.code ?? "provider_error";
    this.status = options.status;
    this.retryAfter = options.retryAfter ?? null;
  }
}

/**
 * @param {() => Promise<string | null | undefined>} getToken
 * @param {string} baseUrl
 */
export function createPoeChatApi(getToken, baseUrl) {
  const url = `${baseUrl.trim().replace(/\/$/, "")}/api/v1/ai/poe/chat`;

  /**
   * @param {Array<{ role: "user" | "poe", text: string }>} messages oldest first, last one from the user
   * @param {{ locale?: string, signal?: AbortSignal }} [options]
   * @returns {Promise<string>} Poe's reply
   */
  async function ask(messages, { locale = "en", signal } = {}) {
    const token = await getToken();
    if (!token) throw new PoeChatError("You need to be signed in.", { code: "authentication_required" });
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ locale, messages: messages.slice(-POE_LIMITS.maxTurns) }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after")) || null;
      throw new PoeChatError(body?.error?.message ?? "Poe could not answer.", {
        code: body?.error?.code,
        status: response.status,
        retryAfter,
      });
    }
    return body.reply;
  }

  return { ask };
}

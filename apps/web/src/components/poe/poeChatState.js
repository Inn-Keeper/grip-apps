// Pure rules for the Poe chat panel, kept apart so node --test can cover them.
import { POE_LIMITS } from "@grip/core/poeChat";

/** One request at a time, never empty, never over the API's cap. */
export function canSend(text, pending) {
  const trimmed = text.trim();
  return !pending && trimmed.length > 0 && trimmed.length <= POE_LIMITS.userChars;
}

/** The API runs without Gemini (local Ollama): hide the chat for this session. */
export function isUnavailable(error) {
  return error?.code === "poe_unavailable";
}

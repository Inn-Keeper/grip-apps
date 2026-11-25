export const STALE_CHUNK_RELOAD_KEY = "grip.staleChunkReloadAt";
const RELOAD_WINDOW_MS = 10_000;

// Reload unless we just did: a chunk still missing after a fresh load is a real error, not a stale tab.
export const shouldReloadForStaleChunk = (lastReloadAt, now) =>
  !lastReloadAt || now - lastReloadAt >= RELOAD_WINDOW_MS;

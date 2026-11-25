import "./global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { themeDataColors } from "./lib/dataColors";
import { initTheme } from "./lib/theme";
import { applyTokenVars } from "./lib/tokenVars";
import { STALE_CHUNK_RELOAD_KEY, shouldReloadForStaleChunk } from "./lib/staleChunk.js";

// A tab opened before a deploy asks for chunk names the new deploy no longer has: reload once.
window.addEventListener("vite:preloadError", (event) => {
  const last = Number(window.sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY)) || null;
  if (!shouldReloadForStaleChunk(last, Date.now())) return;
  window.sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

// Dev only: name the model behind each AI call in the browser console. Builds drop this block.
if (import.meta.env.DEV) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init);
    const model = response.headers.get("x-grip-model");
    if (model) {
      const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
      console.info(`[grip ai] ${url.pathname.replace("/api/v1/ai/", "")} → ${model}`);
    }
    return response;
  };
}

applyTokenVars();
themeDataColors();
initTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

// Expose QueryClient to browser console for debugging
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: typeof queryClient;
  }
}
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

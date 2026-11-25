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

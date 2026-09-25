import { useCallback, useEffect, useState } from "react";
import { guardHistoryNavigation, isAuthReturn } from "./navigation.js";

export const PAGE_DEFS = [
  { id: "prep", icon: "layers", labelKey: "tabs.prep" },
  { id: "stories", icon: "story", labelKey: "tabs.stories" },
  { id: "board", icon: "board", labelKey: "tabs.board" },
  { id: "quest", icon: "quest", labelKey: "tabs.quest" },
  { id: "about", icon: "fly", labelKey: "tabs.about" },
  { id: "profile", icon: "profile", labelKey: "tabs.profile" },
] as const;

export const DEFAULT_PAGE = "prep";
export const ACTIVE_PAGE_KEY = "grip.activePage";
export const GITHUB_LINK_PENDING_KEY = "grip.githubLinkPending";
const PAGE_IDS: readonly string[] = PAGE_DEFS.map((p) => p.id);

// Read once at module load: Supabase clears the OAuth hash/code from the URL once it has
// exchanged it, which can happen before React's first render.
const returningFromSignIn = typeof window !== "undefined" && isAuthReturn(window.location.search, window.location.hash);

// "contacts" is Quest's old name; old links and saved preferences still land there.
const pageFromName = (name: string | null) => (name === "contacts" ? "quest" : name && PAGE_IDS.includes(name) ? name : null);

// Which page to show on load: the URL path, then the stored preference.
// A GitHub OAuth return (?linked=github) overrides both; signing in always opens Prep.
const initialPage = () => {
  if (typeof window === "undefined") return DEFAULT_PAGE;
  const params = new URLSearchParams(window.location.search);
  if (params.get("linked") === "github" || window.localStorage.getItem(GITHUB_LINK_PENDING_KEY) === "1") return "profile";
  if (returningFromSignIn) return DEFAULT_PAGE;
  return pageFromName(window.location.pathname.replace(/^\//, "")) ?? pageFromName(window.localStorage.getItem(ACTIVE_PAGE_KEY)) ?? DEFAULT_PAGE;
};

// The active page, kept in step with the URL, localStorage and back/forward.
// Every change goes through the "grip:navigate" guard, so unsaved work can veto it.
export function usePageRoute() {
  const [page, setPage] = useState(initialPage);

  const selectPage = (id: string) => {
    if (!window.dispatchEvent(new CustomEvent("grip:navigate", { cancelable: true }))) return;
    setPage(id);
    window.localStorage.setItem(ACTIVE_PAGE_KEY, id);
    window.history.pushState({ page: id }, "", `/${id}`);
    // A new page starts at its top, not at the scroll offset of the one we left.
    window.scrollTo(0, 0);
  };

  // Back/forward, behind the same unsaved-changes guard as the tabs. No scrollTo:
  // the browser restores where you were on that page.
  useEffect(() => {
    const onPop = () => {
      if (!guardHistoryNavigation(window, page)) return;
      setPage(pageFromName(window.location.pathname.replace(/^\//, "")) ?? DEFAULT_PAGE);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [page]);

  // Cross-tab hops from feature components (e.g. Quest's "Drill these in Prep").
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (PAGE_IDS.includes(id)) selectPage(id);
    };
    window.addEventListener("grip:navigate", onNavigate);
    return () => window.removeEventListener("grip:navigate", onNavigate);
  }, []);

  // A fresh sign-in lands on Prep, replacing history rather than adding to it.
  const resetToDefault = useCallback(() => {
    setPage(DEFAULT_PAGE);
    window.localStorage.setItem(ACTIVE_PAGE_KEY, DEFAULT_PAGE);
    window.history.replaceState({ page: DEFAULT_PAGE }, "", `/${DEFAULT_PAGE}`);
  }, []);

  return { page, selectPage, resetToDefault };
}

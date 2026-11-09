import { useCallback, useEffect, useState } from "react";
import { guardHistoryNavigation, isAuthReturn, pageFromName, pageFromPath } from "./navigation.js";

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

type Route = { page: string; pathname: string };
const routeFor = (pathname: string): Route => {
  const page = pageFromPath(pathname);
  return page ? { page, pathname } : { page: DEFAULT_PAGE, pathname: `/${DEFAULT_PAGE}` };
};

// Which route to show on load: the URL path, then the stored page.
// A GitHub OAuth return (?linked=github) opens preparation; signing in always opens Prep.
const initialRoute = (): Route => {
  if (typeof window === "undefined") return routeFor(`/${DEFAULT_PAGE}`);
  const { pathname, search } = window.location;
  const linking = new URLSearchParams(search).get("linked") === "github" || window.localStorage.getItem(GITHUB_LINK_PENDING_KEY) === "1";
  if (linking) return routeFor(pageFromPath(pathname) === "profile" ? pathname : "/profile/preparation");
  if (returningFromSignIn) return routeFor(`/${DEFAULT_PAGE}`);
  if (pageFromPath(pathname)) return routeFor(pathname);
  return routeFor(`/${pageFromName(window.localStorage.getItem(ACTIVE_PAGE_KEY)) ?? DEFAULT_PAGE}`);
};

const canNavigate = () => window.dispatchEvent(new CustomEvent("grip:navigate", { cancelable: true }));

// The active page and full path, kept in step with the URL, localStorage and back/forward.
// Every change goes through the "grip:navigate" guard, so unsaved work can veto it.
export function usePageRoute() {
  const [route, setRoute] = useState(initialRoute);

  // replace: rewrite the current entry (redirects) without asking the guard.
  const navigatePath = useCallback((path: string, options?: { replace?: boolean }) => {
    if (!options?.replace && !canNavigate()) return;
    const next = routeFor(path);
    setRoute((current) => {
      if (current.page !== next.page && !options?.replace) window.scrollTo(0, 0);
      return next;
    });
    window.localStorage.setItem(ACTIVE_PAGE_KEY, next.page);
    window.history[options?.replace ? "replaceState" : "pushState"]({ path: next.pathname }, "", next.pathname);
  }, []);

  const selectPage = (id: string) => navigatePath(`/${id}`);

  // Back/forward, behind the same guard as the tabs. No scrollTo: the browser restores position.
  useEffect(() => {
    const onPop = () => {
      if (!guardHistoryNavigation(window, route.pathname)) return;
      setRoute(routeFor(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [route.pathname]);

  // Cross-tab hops from feature components (e.g. Quest's "Drill these in Prep").
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (PAGE_IDS.includes(id)) navigatePath(`/${id}`);
    };
    window.addEventListener("grip:navigate", onNavigate);
    return () => window.removeEventListener("grip:navigate", onNavigate);
  }, [navigatePath]);

  // A fresh sign-in lands on Prep, replacing history rather than adding to it.
  const resetToDefault = useCallback(() => navigatePath(`/${DEFAULT_PAGE}`, { replace: true }), [navigatePath]);

  return { page: route.page, pathname: route.pathname, selectPage, navigatePath, resetToDefault };
}

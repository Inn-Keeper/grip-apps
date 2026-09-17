import React, { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { identityChanged } from "@grip/core/authCache";
import { setLocale, t } from "@grip/core/i18n";
import { guardHistoryNavigation } from "./lib/navigation.js";
import { supabase } from "./lib/supabase";
import { useLocale } from "./lib/useLocale";
import InterviewPrep from "./interviewPrep/InterviewPrep";
import Quest from "./quest/Quest";
import ArchBoard from "./archBoard/ArchBoard";
import { SharedBoardPage } from "./archBoard/SharedBoardPage";
import StoryBank from "./storyBank/StoryBank";
import Profile from "./profile/Profile";
import About from "./about/About";
import { brand, colors, layout } from "@grip/core/tokens";
import { BrandIcon } from "./components/BrandIcon";
import { DemoBanner } from "./components/DemoBanner";
import { Footer } from "./Footer";
import { SignIn } from "./SignIn";

const PAGE_DEFS = [
  { id: "prep", icon: "layers", labelKey: "tabs.prep" },
  { id: "stories", icon: "story", labelKey: "tabs.stories" },
  { id: "board", icon: "board", labelKey: "tabs.board" },
  { id: "quest", icon: "quest", labelKey: "tabs.quest" },
  { id: "profile", icon: "profile", labelKey: "tabs.profile" },
  { id: "about", icon: "spark", labelKey: "tabs.about" },
] as const;

const GITHUB_LINK_PENDING_KEY = "grip.githubLinkPending";
const GITHUB_LINKED_KEY = "grip.githubLinked";
const ACTIVE_PAGE_KEY = "grip.activePage";

const DEFAULT_PAGE = "prep";
const PAGE_IDS = PAGE_DEFS.map((p) => p.id);
const LOCALE_STORAGE_KEY = "grip.locale";

// Restore persisted locale before first render so all t() calls use it.
const savedLocale = typeof window !== "undefined" ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null;
if (savedLocale) setLocale(savedLocale);

// Resolves which page to show on load from the URL path, falling back to
// stored preference. A GitHub OAuth return (?linked=github) overrides both.
const initialPage = () => {
  if (typeof window === "undefined") return DEFAULT_PAGE;
  const params = new URLSearchParams(window.location.search);
  if (params.get("linked") === "github" || window.localStorage.getItem(GITHUB_LINK_PENDING_KEY) === "1") {
    return "profile";
  }
  const fromPath = window.location.pathname.replace(/^\//, "");
  if (fromPath === "contacts") return "quest";
  if (fromPath && (PAGE_IDS as readonly string[]).includes(fromPath)) return fromPath;
  const saved = window.localStorage.getItem(ACTIVE_PAGE_KEY);
  if (saved === "contacts") return "quest";
  return saved && (PAGE_IDS as readonly string[]).includes(saved) ? saved : DEFAULT_PAGE;
};

export default function App() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(initialPage);
  const locale = useLocale();
  const [githubLinked, setGithubLinked] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("linked") === "github" || window.localStorage.getItem(GITHUB_LINKED_KEY) === "1";
  });
  // undefined = loading, null = signed out, Session = signed in
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const previousUserId = useRef<string | null | undefined>(undefined);
  const navRef = useRef<HTMLElement | null>(null);

  const pages = PAGE_DEFS.map((p) => ({ ...p, label: t(p.labelKey as Parameters<typeof t>[0]) }));

  const handleLocaleChange = (code: string) => {
    setLocale(code);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
  };

  const selectPage = (id: string) => {
    if (!window.dispatchEvent(new CustomEvent("grip:navigate", { cancelable: true }))) return;
    setPage(id);
    window.localStorage.setItem(ACTIVE_PAGE_KEY, id);
    window.history.pushState({ page: id }, "", `/${id}`);
  };

  // Sync state with browser back/forward, behind the same unsaved-changes guard as the tabs.
  useEffect(() => {
    const onPop = () => {
      if (!guardHistoryNavigation(window, page)) return;
      const fromPath = window.location.pathname.replace(/^\//, "");
      const next = fromPath === "contacts" ? "quest" : fromPath;
      setPage((PAGE_IDS as readonly string[]).includes(next) ? next : DEFAULT_PAGE);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [page]);

  // Cross-tab hops from feature components (e.g. Quest's "Drill these in Prep").
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if ((PAGE_IDS as readonly string[]).includes(id)) selectPage(id);
    };
    window.addEventListener("grip:navigate", onNavigate);
    return () => window.removeEventListener("grip:navigate", onNavigate);
  }, []);

  useEffect(() => {
    const applySession = (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id ?? null;
      if (identityChanged(previousUserId.current, nextUserId)) queryClient.clear();
      previousUserId.current = nextUserId;
      setSession(nextSession);
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      applySession(nextSession)
    );
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [locale, page, session]);

  useEffect(() => {
    const activeLabel = pages.find((p) => p.id === page)?.label ?? brand.productName;
    document.title = `${activeLabel} - ${brand.productName}`;
  }, [locale, page, pages]);

  const signOut = () => {
    queryClient.clear();
    window.localStorage.removeItem(GITHUB_LINK_PENDING_KEY);
    window.localStorage.removeItem(GITHUB_LINKED_KEY);
    window.localStorage.removeItem(ACTIVE_PAGE_KEY);
    supabase.auth.signOut();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("linked") !== "github") return;
    window.localStorage.removeItem(GITHUB_LINK_PENDING_KEY);
    window.localStorage.setItem(GITHUB_LINKED_KEY, "1");
    setGithubLinked(true);
    params.delete("linked");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", next);
  }, []);

  // Public read-only share links (/share/:token) render standalone — no session.
  const shareToken = window.location.pathname.startsWith("/share/")
    ? window.location.pathname.split("/")[2] ?? ""
    : "";
  if (shareToken) return <SharedBoardPage token={shareToken} />;

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Noise texture overlay — low-opacity, pointer-events-none so it never blocks interaction */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.032,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />
      <header
        style={{
          minHeight: layout.webHeaderHeight,
          borderBottom: `1px solid ${colors.border}`,
          background: `linear-gradient(180deg, ${colors.bgDeep}, ${colors.bg}F2)`,
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(14px)",
          boxShadow: "0 14px 38px rgba(0, 0, 0, 0.18)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M0 8L8 0M-1 1L1-1M7 9L9 7' stroke='%23ffffff' stroke-width='0.8'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "8px 8px",
          }}
        />
        <div
          style={{
            minHeight: layout.webHeaderHeight,
            padding: "10px 24px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 150 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(145deg, ${colors.surfaceHi}, ${colors.bgDeep})`,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 0 0 1px ${colors.accent}18, 0 10px 24px rgba(0, 0, 0, 0.22)`,
              }}
            >
              <BrandIcon name="spark" color={colors.accentBright} size={24} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0px", color: colors.textBright, lineHeight: 1 }}>
                {brand.productName}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.textFaint, lineHeight: 1.2 }}>
                {brand.tagline}
              </span>
            </span>
          </div>
          {session && (
            <>
              <nav
                ref={navRef}
                aria-label="Primary"
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 5,
                  borderRadius: 16,
                  background: `${colors.well}C7`,
                  border: `1px solid ${colors.border}`,
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
                  minWidth: 0,
                  overflowX: "auto",
                  overflowY: "hidden",
                  scrollbarWidth: "none",
                  justifyContent: "flex-end",
                }}
              >
                {pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPage(p.id)}
                    aria-current={page === p.id ? "page" : undefined}
                    data-tour={`nav-${p.id}`}
                    style={{
                      flex: "0 0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      minHeight: 36,
                      padding: "8px 14px",
                      borderRadius: 11,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: "0px",
                      whiteSpace: "nowrap",
                      background: page === p.id ? colors.accent : "transparent",
                      boxShadow: page === p.id ? `0 8px 22px ${colors.accent}22` : "none",
                      color: page === p.id ? colors.onAccent : colors.textDim,
                      transition: "background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <BrandIcon name={p.icon} color={page === p.id ? colors.onAccent : colors.textDim} size={16} />
                    {p.label}
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>
      </header>
      {session?.user.is_anonymous && <DemoBanner />}

      <div style={{ flex: 1 }}>
        {session === undefined && (
          <main
            style={{
              minHeight: `calc(100vh - ${layout.webHeaderHeight}px)`,
              display: "grid",
              placeItems: "center",
              color: colors.textFaint,
              fontSize: 13,
            }}
          >
            Loading…
          </main>
        )}
        {session === null && <SignIn />}
        {session && (
          <React.Fragment key={locale}>
            {page === "prep" && <InterviewPrep />}
            {page === "stories" && <StoryBank />}
            {page === "board" && <ArchBoard />}
            {page === "quest" && <Quest />}
            {page === "profile" && <Profile githubLinked={githubLinked} onGitHubLinkedSeen={() => setGithubLinked(false)} onSignOut={signOut} onLocaleChange={handleLocaleChange} />}
            {page === "about" && <About onNavigate={selectPage} />}
          </React.Fragment>
        )}
      </div>

      <Footer pages={pages} onNavigate={session ? selectPage : null} />
    </div>
  );
}

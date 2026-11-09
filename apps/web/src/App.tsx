import React, { useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { identityChanged } from "@grip/core/authCache";
import { setLocale, t } from "@grip/core/i18n";
import { isFreshSignIn } from "./lib/navigation.js";
import { ACTIVE_PAGE_KEY, DEFAULT_PAGE, GITHUB_LINK_PENDING_KEY, PAGE_DEFS, usePageRoute } from "./lib/usePageRoute";
import { useHeaderHeightVar, useNavPill } from "./lib/useNavMeasures";
import { supabase } from "./lib/supabase";
import { useLocale } from "./lib/useLocale";
import InterviewPrep from "./interviewPrep/InterviewPrep";
import Quest from "./quest/Quest";
import ArchBoard from "./archBoard/ArchBoard";
import { SharedBoardPage } from "./archBoard/SharedBoardPage";
import { clearSeenQuestions } from "./interviewPrep/questionDeck";
import StoryBank from "./storyBank/StoryBank";
import Profile from "./profile/Profile";
import { useProfileQuery, useSaveProfileMutation } from "./profile/queries";
import { FirstRunWizard } from "./firstRun/FirstRunWizard";
import type { Landing } from "./firstRun/GenerateStep";
import { shouldShowWizard, wizardUndecided } from "./firstRun/gating.js";
import { openInBoard } from "./lib/boardHandoff";
import About from "./about/About";
import { PoeChat, PoeChatProvider } from "./components/poe/PoeChat";
import { poeHistoryKey } from "./components/poe/poeChatContext";
import { usePoeMascotVisible } from "./components/poe/usePoeHooks";
import { brand, colors, layout } from "./lib/tokens";
import { BrandIcon } from "./components/BrandIcon";
import { BrandMark } from "./components/BrandMark";
import { DemoBanner } from "./components/DemoBanner";
import { Footer } from "./Footer";
import { SignIn } from "./SignIn";
import styles from "./App.module.css";

const GITHUB_LINKED_KEY = "grip.githubLinked";
const LOCALE_STORAGE_KEY = "grip.locale";

// Restore persisted locale before first render so all t() calls use it.
const savedLocale = typeof window !== "undefined" ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null;
if (savedLocale) setLocale(savedLocale);


export default function App() {
  const queryClient = useQueryClient();
  const { page, pathname, selectPage, navigatePath, resetToDefault } = usePageRoute();
  const locale = useLocale();
  const [githubLinked, setGithubLinked] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("linked") === "github" || window.localStorage.getItem(GITHUB_LINKED_KEY) === "1";
  });
  // undefined = loading, null = signed out, Session = signed in
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const previousUserId = useRef<string | null | undefined>(undefined);
  const navRef = useRef<HTMLElement | null>(null);
  // "auto" follows the profile flag; "open" is a manual rerun; "closed" hides it for this visit.
  // ?setup=1 (the mobile Next Up link) opens it directly.
  const [setup, setSetup] = useState<"auto" | "open" | "closed">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("setup") === "1" ? "open" : "auto"
  );
  useEffect(() => {
    // Read once; drop it so a reload doesn't reopen the wizard.
    const params = new URLSearchParams(window.location.search);
    if (!params.has("setup")) return;
    params.delete("setup");
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`);
  }, []);
  const headerRef = useRef<HTMLElement | null>(null);

  const pages = PAGE_DEFS.map((p) => ({ ...p, label: t(p.labelKey as Parameters<typeof t>[0]) }));

  const handleLocaleChange = (code: string) => {
    setLocale(code);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
  };

  useEffect(() => {
    const applySession = (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id ?? null;
      if (identityChanged(previousUserId.current, nextUserId)) {
        queryClient.clear();
        clearSeenQuestions();
      }
      // Signing in from the sign-in screen always opens Prep (a reload keeps the current page).
      if (isFreshSignIn(previousUserId.current, nextUserId)) resetToDefault();
      previousUserId.current = nextUserId;
      setSession(nextSession);
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      applySession(nextSession)
    );
    return () => sub.subscription.unsubscribe();
  }, [queryClient, resetToDefault]);

  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [locale, page, session]);

  const navPill = useNavPill(navRef, [locale, page, session]);
  useHeaderHeightVar(headerRef);

  useEffect(() => {
    const activeLabel = pages.find((p) => p.id === page)?.label ?? brand.productName;
    document.title = `${activeLabel} - ${brand.productName}`;
  }, [locale, page, pages]);

  const signOut = () => {
    queryClient.clear();
    window.localStorage.removeItem(GITHUB_LINK_PENDING_KEY);
    window.localStorage.removeItem(GITHUB_LINKED_KEY);
    window.localStorage.removeItem(ACTIVE_PAGE_KEY);
    if (session) window.localStorage.removeItem(poeHistoryKey(session.user.id));
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

  const profileQuery = useProfileQuery(!!session);
  const mascotVisible = usePoeMascotVisible();
  const onPrepWithMascot = page === "prep" && mascotVisible;
  const saveProfile = useSaveProfileMutation();
  const gateArgs = { session, profile: profileQuery.isSuccess ? profileQuery.data : undefined, openedManually: setup === "open" };
  const showWizard =
    setup !== "closed" &&
    shouldShowWizard(gateArgs);
  // Until the profile says whether onboarding is done, show neither pages nor tabs (no Prep flash).
  const undecided = setup === "auto" && !profileQuery.isError && wizardUndecided(gateArgs);
  const showPages = !showWizard && !undecided;
  const openSetup = () => setSetup("open");
  const landFromSetup = ({ page: target, scenarioId, boardId }: Landing) => {
    saveProfile.mutate({ onboardingCompleted: true });
    setSetup("closed");
    // The starter board opens saved, so the user starts from its components.
    if (target === "board" && scenarioId) openInBoard(boardId ? { scenarioId, boardId } : { scenarioId });
    else selectPage(target);
  };
  const exploreFirst = () => {
    saveProfile.mutate({ onboardingCompleted: true });
    setSetup("closed");
  };

  // Public read-only share links (/share/:token) render standalone — no session.
  const shareToken = window.location.pathname.startsWith("/share/")
    ? window.location.pathname.split("/")[2] ?? ""
    : "";
  if (shareToken) return <SharedBoardPage token={shareToken} />;

  return (
    <div className={styles.app}>
      <div aria-hidden="true" className={styles.noise} />
      <header ref={headerRef} className={styles.header} style={{ minHeight: layout.webHeaderHeight }}>
        <div aria-hidden="true" className={styles.headerGlow} />
        <div className={styles.headerInner} style={{ minHeight: layout.webHeaderHeight }}>
          {/* Signed in, the logo links home; cmd/ctrl-click still opens a new tab. */}
          <a
            href={session ? `/${DEFAULT_PAGE}` : undefined}
            aria-label={session ? `${brand.productName}, ${t("nav.home")}` : undefined}
            onClick={(e) => {
              if (!session || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              selectPage(DEFAULT_PAGE);
            }}
            className={styles.brandLink}>
            <BrandMark size={36} className={styles.brandMark} />
            <span className={styles.brandText}>
              <span className={styles.productName}>{brand.productName}</span>
              <span className={styles.tagline}>{brand.tagline}</span>
            </span>
          </a>
          {/* The wizard owns the screen until it lands or the user explores; tabs would do nothing. */}
          {session && showPages && (
            <>
              <nav
                ref={navRef}
                aria-label={t("nav.primary")}
                className={styles.nav}
              >
                {navPill && (
                  <span
                    aria-hidden="true"
                    className={styles.navPill}
                    style={{
                      left: navPill.left,
                      width: navPill.width,
                    }}
                  />
                )}
                {pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPage(p.id)}
                    aria-current={page === p.id ? "page" : undefined}
                    data-tour={`nav-${p.id}`}
                    className={styles.tab}
                  >
                    <BrandIcon name={p.icon} color={page === p.id ? colors.accentBright : colors.textDim} size={16} />
                    {p.label}
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>
      </header>
      {session && <DemoBanner anonymous={!!session.user.is_anonymous} />}

      {/* Fills the space between header and footer, so the footer sits at the bottom of the
          screen on short pages. Pages must not add their own full-screen min-height. */}
      <div className={styles.content}>
        {session === undefined && <main className={styles.loading}>Loading…</main>}
        {session === null && <SignIn />}
        {session && (
          <PoeChatProvider key={session.user.id} userId={session.user.id}>
          <React.Fragment key={locale}>
            {showWizard && <FirstRunWizard profile={profileQuery.data ?? null} onLand={landFromSetup} onExplore={exploreFirst} />}
            {showPages && page === "prep" && <InterviewPrep onOpenSetup={openSetup} />}
            {showPages && page === "stories" && <StoryBank onOpenSetup={openSetup} />}
            {showPages && page === "board" && <ArchBoard />}
            {showPages && page === "quest" && <Quest />}
            {showPages && page === "about" && <About onNavigate={selectPage} />}
            {showPages && page === "profile" && <Profile pathname={pathname} onNavigatePath={navigatePath} onOpenSetup={openSetup} githubLinked={githubLinked} onGitHubLinkedSeen={() => setGithubLinked(false)} onSignOut={signOut} onLocaleChange={handleLocaleChange} />}
          </React.Fragment>
          {/* On Prep the mascot opens the chat, so the bubble steps aside. */}
          {showPages && <PoeChat showBubble={!onPrepWithMascot} />}
          </PoeChatProvider>
        )}
      </div>

      <Footer pages={pages} onNavigate={session ? selectPage : null} />
      <Analytics />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { RANKS, rankForXp } from "@grip/core/gamification";
import { alpha, colors, font, tints } from "../lib/tokens";
import { EMPTY_PROFILE_FORM, profileFormToUpdate, profileToForm } from "@grip/core/user";
import { setLocale, t } from "@grip/core/i18n";
import { useLocale } from "../lib/useLocale";
import { poeVisibleByDefault, setPoeAssistantVisible } from "../components/poe/poeAssistantUtils";
import { WorkspaceLayout, WorkspacePanel } from "../components/WorkspaceLayout";
import { miniBtn } from "../components/fieldStyles";
import { CvUpload } from "./CvUpload";
import { PreparationSection } from "./PreparationSection";
import { PreparationEditor } from "./PreparationEditor";
import type { User } from "@grip/core/api";
import { ProfileLeftRail, ProfileRightRail } from "./ProfileRails";
import { AccountSection, ConnectionsSection, PreferencesSection } from "./ProfileSections";
import type { ProfileSection } from "./sections";
import { parseProfilePath, profilePath, profileRedirect } from "./routes.js";
import {
  useAuthIdentitiesQuery,
  useAuthUserQuery,
  useGithubPrepMutation,
  useGithubPublicUrlQuery,
  useGithubViewerUrlQuery,
  useLinkGitHubMutation,
  usePreparationQuery,
  useProfileQuery,
  useResetScoresMutation,
  useResetGoalsMutation,
  useSaveCvTechsMutation,
  useSaveGithubUrlMutation,
  useSaveProfileMutation,
} from "./queries";
import {
  githubAccountIdFromIdentity,
  githubAccountIdFromMetadata,
  githubUrlFromIdentity,
  githubUrlFromMetadata,
} from "./githubUtils";
import type { ProfileForm } from "./types";
import { ErrorText } from "../components/ErrorText";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { categories } from "@grip/core/prepData";

const GITHUB_LINKED_KEY = "grip.githubLinked";

type ProfileProps = {
  pathname: string;
  onNavigatePath: (path: string, options?: { replace?: boolean }) => void;
  githubLinked?: boolean;
  onGitHubLinkedSeen?: () => void;
  onSignOut?: () => void;
  onLocaleChange?: (code: string) => void;
  onOpenSetup?: () => void;
};

export default function Profile({ pathname, onNavigatePath, githubLinked = false, onGitHubLinkedSeen, onSignOut, onLocaleChange, onOpenSetup }: ProfileProps) {
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE_FORM as ProfileForm);
  const locale = useLocale();
  const [linkedInThisSession, setLinkedInThisSession] = useState(
    () => githubLinked || window.localStorage.getItem(GITHUB_LINKED_KEY) === "1",
  );
  const [poeVisible, setPoeVisible] = useState(poeVisibleByDefault);
  const route = parseProfilePath(pathname);
  // Nested preparation routes keep "Your preparation" active in the menu.
  const section: ProfileSection | null =
    route === "edit" || route === "playbook" ? "preparation" : route === "notFound" ? null : route;
  const setSection = (next: ProfileSection) => onNavigatePath(profilePath(next));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstPath = useRef(pathname);

  // Bare /profile and legacy aliases rewrite the URL instead of adding an entry.
  useEffect(() => {
    const target = profileRedirect(pathname);
    if (target) onNavigatePath(target, { replace: true });
  }, [pathname, onNavigatePath]);

  // Move focus to the new heading after in-app navigation, not on first load.
  useEffect(() => {
    if (firstPath.current === pathname) return;
    firstPath.current = "";
    headingRef.current?.focus();
  }, [pathname]);
  // Autosave feedback: the field that just saved, and a failed save for the field that caused it.
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ key: string; message: string } | null>(null);
  // The field being typed in survives the refetch that follows another field's save.
  const editingKey = useRef<string | null>(null);

  const { data: profile = null, error: loadError, isLoading } = useProfileQuery();
  const { data: preparation = null, error: preparationError, isLoading: preparationLoading } = usePreparationQuery();
  const [savedNotice, setSavedNotice] = useState(false);
  const leaveEditor = useCallback(
    (saved: boolean) => {
      setSavedNotice(saved);
      onNavigatePath(profilePath("preparation"));
    },
    [onNavigatePath],
  );
  const { data: identities = [], error: identitiesError } = useAuthIdentitiesQuery();
  const { data: authUser = null, error: authUserError } = useAuthUserQuery();

  const { data: githubViewerUrl = "", error: githubViewerError } = useGithubViewerUrlQuery(githubLinked);

  const authProviders = authUser?.app_metadata?.providers ?? [];
  const authIdentities = authUser?.identities ?? [];
  const githubIdentity = [...identities, ...authIdentities].find((identity) => identity.provider === "github");
  const githubAccountId =
    githubAccountIdFromIdentity(githubIdentity) || githubAccountIdFromMetadata(authUser?.user_metadata);

  const { data: githubPublicUrl = "", error: githubPublicError } = useGithubPublicUrlQuery(githubAccountId);

  const saveMutation = useSaveProfileMutation();
  const saveGithubUrlMutation = useSaveGithubUrlMutation();
  const githubPrepMutation = useGithubPrepMutation();
  const cvTechsMutation = useSaveCvTechsMutation();
  const resetMutation = useResetScoresMutation(profile);
  const resetGoalsMutation = useResetGoalsMutation();
  const linkGitHubMutation = useLinkGitHubMutation();


  const githubUrl =
    profile?.githubUrl ||
    githubUrlFromIdentity(githubIdentity) ||
    githubUrlFromMetadata(authUser?.user_metadata) ||
    githubViewerUrl ||
    githubPublicUrl;
  const githubConnected = linkedInThisSession || authProviders.includes("github") || !!githubIdentity;

  useEffect(() => {
    if (!profile) return;
    const next = profileToForm(profile) as ProfileForm;
    if (!next.githubUrl && githubUrl) next.githubUrl = githubUrl;
    setForm((current) =>
      editingKey.current ? { ...next, [editingKey.current]: current[editingKey.current] ?? "" } : next,
    );
  }, [githubUrl, profile]);

  useEffect(() => {
    if (!savedKey) return;
    const timer = window.setTimeout(() => setSavedKey(null), 2000);
    return () => window.clearTimeout(timer);
  }, [savedKey]);

  useEffect(() => {
    if (!profile || profile.githubUrl || !githubUrl || saveGithubUrlMutation.isPending) return;
    saveGithubUrlMutation.mutate(githubUrl);
  }, [githubUrl, profile, saveGithubUrlMutation]);

  useEffect(() => {
    if (!githubLinked) return;
    setLinkedInThisSession(true);
    const timeout = window.setTimeout(() => onGitHubLinkedSeen?.(), 4000);
    return () => window.clearTimeout(timeout);
  }, [githubLinked, onGitHubLinkedSeen]);

  const changeField = (key: string, value: string) => {
    editingKey.current = key;
    setForm((current) => ({ ...current, [key]: value }));
  };
  // Autosave (rule 12): a field saves when you leave it, only if it changed.
  const commitField = (key: string) => {
    editingKey.current = null;
    if (!profile) return;
    const saved = profileToForm(profile) as ProfileForm;
    if ((form[key] ?? "") === (saved[key] ?? "")) return;
    setFieldError(null);
    saveMutation.mutate(profileFormToUpdate(form), {
      onSuccess: () => setSavedKey(key),
      onError: (err: Error) => setFieldError({ key, message: t("profile.saveFailed", { message: err.message }) }),
    });
  };
  const rank = rankForXp(profile?.xp ?? 0) ?? RANKS[0]!;
  const next = RANKS.find((item) => item.min > rank.min);
  const [confirmResetGoals, setConfirmResetGoals] = useState(false);
  const resetGoals = () => {
    setConfirmResetGoals(false);
    // Reset turns the wizard back on; open it right away to start over.
    resetGoalsMutation.mutate(undefined, { onSuccess: () => onOpenSetup?.() });
  };
  const resetScores = () => {
    if (!window.confirm(t("profile.resetConfirm"))) return;
    resetMutation.mutate();
  };
  const updatePoeVisibility = (checked: boolean) => {
    setPoeVisible(checked);
    setPoeAssistantVisible(checked);
  };
  const loadErrors = (loadError ||
    preparationError ||
    identitiesError ||
    authUserError ||
    githubViewerError ||
    githubPublicError ||
    saveGithubUrlMutation.error) as Error | null;
  const connectionsError = (linkGitHubMutation.error || githubPrepMutation.error) as Error | null;
  const header = {
    // No subtitle: Next Up above already says what a complete profile does.
    account: { title: t("profile.account"), sub: "" },
    preparation: {
      title: route === "edit" ? t("profile.preparation.editTitle") : t("profile.preparation.menu"),
      sub: route === "edit" ? "" : t("profile.preparation.subtitle"),
    },
    preferences: { title: t("profile.preferences"), sub: t("profile.preferencesSub") },
    notFound: { title: t("profile.notFoundTitle"), sub: "" },
  }[section ?? "notFound"];

  const prepTechs = categories.flatMap((c) => c.items).map((item) => item.tech);

  return (
    <WorkspaceLayout
      mainLabel={t("profile.settings")}
      left={
        <ProfileLeftRail
          profile={profile}
          section={section}
          onSection={setSection}
          onSignOut={onSignOut}
        />
      }
      right={
        <ProfileRightRail
          profile={profile}
          rank={rank}
          next={next}
        />
      }
    >
      <div style={{ marginBottom: 16 }}>
        <h1
          ref={headingRef}
          tabIndex={-1}
          style={{
            outline: "none",
            margin: 0,
            color: colors.textBright,
            fontSize: font.size.heading,
            fontWeight: 800,
          }}
        >
          {header.title}
        </h1>
        {(isLoading || header.sub) && (
          <p
            style={{
              margin: "6px 0 0",
              maxWidth: 720,
              color: colors.textFaint,
              fontSize: font.size.body,
              lineHeight: 1.6,
            }}
          >
            {isLoading ? t("common.loading") : header.sub}
          </p>
        )}
      </div>

      {loadErrors && <Banner tone="danger">{loadErrors.message}</Banner>}
      {savedNotice && route === "preparation" && <Banner tone="success">{t("profile.preparation.saved")}</Banner>}
      {githubLinked && <Banner tone="success">{t("profile.githubConnectedBanner")}</Banner>}

      <div
        style={{
          width: "min(100%, 920px)",
          paddingBottom: 48,
        }}
      >
        {section === "account" && (
          <AccountSection
            form={form}
            profile={profile}
            savedKey={savedKey}
            error={fieldError}
            onChange={changeField}
            onCommit={commitField}
          />
        )}
        {route === "notFound" && (
          <button type="button" onClick={() => setSection("preparation")} style={miniBtn(colors.accentBright ?? "")}>
            {t("profile.notFoundAction")}
          </button>
        )}
        {route === "preparation" && (
          <PreparationSection
            profile={profile}
            preparation={preparation}
            catalogue={prepTechs}
            onEdit={() => onNavigatePath(profilePath("edit"))}
            sources={
              <>
                <WorkspacePanel style={{
                    padding: 20,
                    marginBottom: 16
                  }}>
                  <CvUpload
                    cvTechs={profile?.cvTechs ?? []}
                    disabled={!profile}
                    pending={cvTechsMutation.isPending}
                    onTechsExtracted={(techs) => cvTechsMutation.mutate(techs)}
                    onClear={() => cvTechsMutation.mutate([])}
                  />
                  {cvTechsMutation.error && (
                    <ErrorText margin="12px 0 0">{(cvTechsMutation.error as Error).message}</ErrorText>
                  )}
                </WorkspacePanel>
                <ConnectionsSection
                  form={form}
                  profile={profile}
                  githubConnected={githubConnected}
                  linkPending={linkGitHubMutation.isPending}
                  githubPrepPending={githubPrepMutation.isPending}
                  onLinkGitHub={() => linkGitHubMutation.mutate()}
                  onGithubPrepChange={(checked) => githubPrepMutation.mutate(checked)}
                />
                {connectionsError && <ErrorText margin="12px 0 0">{connectionsError.message}</ErrorText>}
              </>
            }
          />
        )}
        {route === "edit" && profile && !preparationLoading && (
          <PreparationEditor
            profile={profile as User}
            preparation={preparation}
            catalogue={prepTechs}
            onDone={leaveEditor}
          />
        )}
        {section === "preferences" && onOpenSetup && (
          <WorkspacePanel style={{
              padding: 20,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap"
            }}>
            <p style={{
                margin: 0,
                flex: "1 1 240px",
                color: colors.textDim,
                fontSize: font.size.body
              }}>{t("firstRun.profile.setupHint")}</p>
            <button type="button" onClick={onOpenSetup} style={miniBtn(colors.accentBright ?? "")}>{t("firstRun.profile.setup")}</button>
            <button type="button" onClick={() => setConfirmResetGoals(true)} disabled={resetGoalsMutation.isPending} style={miniBtn(colors.dangerBright ?? "")}>
              {resetGoalsMutation.isPending ? t("firstRun.profile.resetting") : t("firstRun.profile.reset")}
            </button>
            {resetGoalsMutation.error && <ErrorText>{(resetGoalsMutation.error as Error).message}</ErrorText>}
            <ConfirmDialog
              open={confirmResetGoals}
              title={t("firstRun.profile.resetTitle")}
              message={t("firstRun.profile.resetConfirm")}
              confirmLabel={t("firstRun.profile.reset")}
              danger
              onConfirm={resetGoals}
              onCancel={() => setConfirmResetGoals(false)}
            />
          </WorkspacePanel>
        )}
        {section === "preferences" && (
          <>
            <PreferencesSection
              poeVisible={poeVisible}
              locale={locale}
              profile={profile}
              resetPending={resetMutation.isPending}
              resetSuccess={resetMutation.isSuccess}
              onPoeVisibilityChange={updatePoeVisibility}
              onLocaleChange={(code) => {
                if (onLocaleChange) onLocaleChange(code);
                else setLocale(code);
              }}
              onResetScores={resetScores}
            />
            {resetMutation.error && <ErrorText margin="12px 0 0">{(resetMutation.error as Error).message}</ErrorText>}
          </>
        )}
      </div>
    </WorkspaceLayout>
  );
}

// Page-level messages that don't belong to a single control (load failures, a fresh GitHub link).
function Banner({ tone, children }: { tone: "danger" | "success"; children: React.ReactNode }) {
  const danger = tone === "danger";
  return (
    <div
      role={danger ? "alert" : "status"}
      style={{
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 8,
        fontSize: font.size.body,
        fontWeight: danger ? 400 : 700,
        background: danger ? tints.dangerSoft : tints.successSoft,
        border: `1px solid ${alpha(danger ? colors.danger : colors.success, 0.38)}`,
        color: danger ? colors.dangerBright : colors.successBright,
      }}
    >
      {children}
    </div>
  );
}

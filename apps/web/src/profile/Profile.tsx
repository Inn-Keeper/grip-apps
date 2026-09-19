import { useEffect, useRef, useState } from "react";
import { RANKS, rankForXp } from "@grip/core/gamification";
import { colors, font, tints } from "@grip/core/tokens";
import { EMPTY_PROFILE_FORM, PROFILE_FIELDS, profileFormToUpdate, profileToForm } from "@grip/core/user";
import { setLocale, t } from "@grip/core/i18n";
import { useLocale } from "../lib/useLocale";
import { poeVisibleByDefault, setPoeAssistantVisible } from "../components/poe/poeAssistantUtils";
import { NextUpShell } from "../components/NextUpShell";
import { WorkspaceLayout, WorkspacePanel } from "../components/WorkspaceLayout";
import { CvUpload } from "./CvUpload";
import { ProfileLeftRail, ProfileRightRail } from "./ProfileRails";
import { AccountSection, ConnectionsSection, PreferencesSection } from "./ProfileSections";
import type { ProfileSection } from "./sections";
import {
  useAuthIdentitiesQuery,
  useAuthUserQuery,
  useGithubPrepMutation,
  useGithubPublicUrlQuery,
  useGithubViewerUrlQuery,
  useLinkGitHubMutation,
  useProfileQuery,
  useResetScoresMutation,
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

const GITHUB_LINKED_KEY = "grip.githubLinked";

type ProfileProps = {
  githubLinked?: boolean;
  onGitHubLinkedSeen?: () => void;
  onSignOut?: () => void;
  onLocaleChange?: (code: string) => void;
};

export default function Profile({ githubLinked = false, onGitHubLinkedSeen, onSignOut, onLocaleChange }: ProfileProps) {
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE_FORM as ProfileForm);
  const locale = useLocale();
  const [linkedInThisSession, setLinkedInThisSession] = useState(
    () => githubLinked || window.localStorage.getItem(GITHUB_LINKED_KEY) === "1"
  );
  const [poeVisible, setPoeVisible] = useState(poeVisibleByDefault);
  const [section, setSection] = useState<ProfileSection>("account");
  // Autosave feedback: the field that just saved, and a failed save for the field that caused it.
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ key: string; message: string } | null>(null);
  // The field being typed in survives the refetch that follows another field's save.
  const editingKey = useRef<string | null>(null);

  const { data: profile = null, error: loadError, isLoading } = useProfileQuery();
  const { data: identities = [], error: identitiesError } = useAuthIdentitiesQuery();
  const { data: authUser = null, error: authUserError } = useAuthUserQuery();

  const { data: githubViewerUrl = "", error: githubViewerError } = useGithubViewerUrlQuery(githubLinked);

  const authProviders = authUser?.app_metadata?.providers ?? [];
  const authIdentities = authUser?.identities ?? [];
  const githubIdentity = [...identities, ...authIdentities].find((identity) => identity.provider === "github");
  const githubAccountId = githubAccountIdFromIdentity(githubIdentity) || githubAccountIdFromMetadata(authUser?.user_metadata);

  const { data: githubPublicUrl = "", error: githubPublicError } = useGithubPublicUrlQuery(githubAccountId);

  const saveMutation = useSaveProfileMutation();
  const saveGithubUrlMutation = useSaveGithubUrlMutation();
  const githubPrepMutation = useGithubPrepMutation();
  const cvTechsMutation = useSaveCvTechsMutation();
  const resetMutation = useResetScoresMutation(profile);
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
    setForm((current) => (editingKey.current ? { ...next, [editingKey.current]: current[editingKey.current] ?? "" } : next));
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
  const resetScores = () => {
    if (!window.confirm(t("profile.resetConfirm"))) return;
    resetMutation.mutate();
  };
  const updatePoeVisibility = (checked: boolean) => {
    setPoeVisible(checked);
    setPoeAssistantVisible(checked);
  };
  const loadErrors = (loadError || identitiesError || authUserError || githubViewerError || githubPublicError || saveGithubUrlMutation.error) as Error | null;
  const connectionsError = (linkGitHubMutation.error || githubPrepMutation.error) as Error | null;
  const completionItems = PROFILE_FIELDS.filter((field) => (form[field.key] ?? "").trim()).length;
  const completionPct = Math.round((completionItems / PROFILE_FIELDS.length) * 100);

  // The one main action (rule 1): the next thing that makes the profile more useful.
  const firstEmpty = PROFILE_FIELDS.find((field) => !(form[field.key] ?? "").trim());
  const focusField = (key: string) => {
    setSection("account");
    window.setTimeout(() => document.getElementById(`profile-${key}`)?.focus(), 0);
  };
  const nextUp = firstEmpty
    ? { title: t("profile.nextFieldTitle", { field: t(firstEmpty.labelKey as Parameters<typeof t>[0]).toLowerCase() }), sub: t("profile.nextFieldSub"), action: t("profile.nextFieldAction"), icon: "profile", onAction: () => focusField(firstEmpty.key) }
    : !(profile?.cvTechs ?? []).length
      ? { title: t("profile.nextCvTitle"), sub: t("profile.nextCvSub"), action: t("profile.nextCvAction"), icon: "story", onAction: () => setSection("cv") }
      : !githubConnected
        ? { title: t("profile.nextGithubTitle"), sub: t("profile.nextGithubSub"), action: t("profile.nextGithubAction"), icon: "globe", onAction: () => setSection("connections") }
        : { title: t("profile.nextDoneTitle"), sub: t("profile.nextDoneSub"), action: t("profile.nextDoneAction"), icon: "story", onAction: () => setSection("cv") };

  const header = {
    // No subtitle: Next Up above already says what a complete profile does.
    account: { title: t("profile.account"), sub: "" },
    cv: { title: t("profile.sectionCv"), sub: t("profile.cvSubtitle") },
    connections: { title: t("profile.connections"), sub: t("profile.connectionsSub") },
    preferences: { title: t("profile.preferences"), sub: t("profile.preferencesSub") },
  }[section];

  return (
    <WorkspaceLayout
      mainLabel={t("profile.settings")}
      left={<ProfileLeftRail profile={profile} section={section} onSection={setSection} onSignOut={onSignOut} />}
      right={<ProfileRightRail completionItems={completionItems} completionPct={completionPct} profile={profile} rank={rank} next={next} />}
    >
      <NextUpShell title={nextUp.title} sub={nextUp.sub} tone={colors.accent ?? ""} actionLabel={nextUp.action} actionIcon={nextUp.icon} onAction={nextUp.onAction} disabled={!profile} />

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, color: colors.textBright, fontSize: font.size.heading, fontWeight: 800 }}>{header.title}</h1>
        {(isLoading || header.sub) && (
          <p style={{ margin: "6px 0 0", maxWidth: 720, color: colors.textFaint, fontSize: font.size.body, lineHeight: 1.6 }}>
            {isLoading ? t("common.loading") : header.sub}
          </p>
        )}
      </div>

      {loadErrors && <Banner tone="danger">{loadErrors.message}</Banner>}
      {githubLinked && <Banner tone="success">{t("profile.githubConnectedBanner")}</Banner>}

      <div style={{ width: "min(100%, 920px)", paddingBottom: 48 }}>
        {section === "account" && (
          <AccountSection form={form} profile={profile} savedKey={savedKey} error={fieldError} onChange={changeField} onCommit={commitField} />
        )}
        {section === "cv" && (
          <WorkspacePanel style={{ padding: 20 }}>
            <CvUpload
              cvTechs={profile?.cvTechs ?? []}
              disabled={!profile}
              pending={cvTechsMutation.isPending}
              onTechsExtracted={(techs) => cvTechsMutation.mutate(techs)}
              onClear={() => cvTechsMutation.mutate([])}
            />
            {cvTechsMutation.error && <p role="alert" style={{ margin: "12px 0 0", color: colors.dangerBright, fontSize: font.size.small }}>{(cvTechsMutation.error as Error).message}</p>}
          </WorkspacePanel>
        )}
        {section === "connections" && (
          <>
            <ConnectionsSection
              form={form}
              profile={profile}
              githubConnected={githubConnected}
              linkPending={linkGitHubMutation.isPending}
              githubPrepPending={githubPrepMutation.isPending}
              onLinkGitHub={() => linkGitHubMutation.mutate()}
              onGithubPrepChange={(checked) => githubPrepMutation.mutate(checked)}
            />
            {connectionsError && <p role="alert" style={{ margin: "12px 0 0", color: colors.dangerBright, fontSize: font.size.small }}>{connectionsError.message}</p>}
          </>
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
              onLocaleChange={(code) => { if (onLocaleChange) onLocaleChange(code); else setLocale(code); }}
              onResetScores={resetScores}
            />
            {resetMutation.error && <p role="alert" style={{ margin: "12px 0 0", color: colors.dangerBright, fontSize: font.size.small }}>{(resetMutation.error as Error).message}</p>}
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
        marginBottom: 16, padding: "12px 14px", borderRadius: 8, fontSize: font.size.body, fontWeight: danger ? 400 : 700,
        background: danger ? tints.dangerSoft : tints.successSoft,
        border: `1px solid ${danger ? colors.danger : colors.success}60`,
        color: danger ? colors.dangerBright : colors.successBright,
      }}
    >
      {children}
    </div>
  );
}

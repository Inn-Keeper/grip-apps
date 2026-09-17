import { useEffect, useState } from "react";
import { RANKS, rankForXp } from "@grip/core/gamification";
import { colors, layout } from "@grip/core/tokens";
import { EMPTY_PROFILE_FORM, PROFILE_FIELDS, profileFormToUpdate, profileToForm } from "@grip/core/user";
import { setLocale, t } from "@grip/core/i18n";
import { useLocale } from "../lib/useLocale";
import { poeVisibleByDefault, setPoeAssistantVisible } from "../components/poe/poeAssistantUtils";
import { ProfileAside } from "./ProfileAside";
import { ProfileFormSection } from "./ProfileFormSection";
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
    setForm(next);
  }, [githubUrl, profile]);

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

  const set = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const rank = rankForXp(profile?.xp ?? 0) ?? RANKS[0]!;
  const next = RANKS.find((item) => item.min > rank.min);
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    saveMutation.mutate(profileFormToUpdate(form));
  };
  const resetScores = () => {
    if (!window.confirm(t("profile.resetConfirm"))) return;
    resetMutation.mutate();
  };
  const updatePoeVisibility = (checked: boolean) => {
    setPoeVisible(checked);
    setPoeAssistantVisible(checked);
  };
  const error = (loadError ||
    identitiesError ||
    authUserError ||
    githubViewerError ||
    githubPublicError ||
    saveMutation.error ||
    saveGithubUrlMutation.error ||
    githubPrepMutation.error ||
    cvTechsMutation.error ||
    resetMutation.error ||
    linkGitHubMutation.error) as Error | null;
  const completionItems = PROFILE_FIELDS.filter((field) => (form[field.key] ?? "").trim()).length;
  const completionPct = Math.round((completionItems / PROFILE_FIELDS.length) * 100);

  return (
    <main
      style={{
        minHeight: `calc(100vh - ${layout.webHeaderHeight}px)`,
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        background: colors.bg,
      }}
    >
      <ProfileAside
        completionItems={completionItems}
        completionPct={completionPct}
        form={form}
        githubConnected={githubConnected}
        githubPrepPending={githubPrepMutation.isPending}
        linkPending={linkGitHubMutation.isPending}
        locale={locale}
        next={next}
        onGithubPrepChange={(checked) => githubPrepMutation.mutate(checked)}
        onLinkGitHub={() => linkGitHubMutation.mutate()}
        onLocaleChange={(code) => { if (onLocaleChange) onLocaleChange(code); else setLocale(code); }}
        onPoeVisibilityChange={updatePoeVisibility}
        onResetScores={resetScores}
        onSignOut={onSignOut}
        poeVisible={poeVisible}
        profile={profile}
        rank={rank}
        resetPending={resetMutation.isPending}
        resetSuccess={resetMutation.isSuccess}
      />
      <ProfileFormSection
        cvTechs={profile?.cvTechs ?? []}
        cvPending={cvTechsMutation.isPending}
        error={error}
        form={form}
        githubLinked={githubLinked}
        isLoading={isLoading}
        onClearCvTechs={() => cvTechsMutation.mutate([])}
        onCvTechsExtracted={(techs) => cvTechsMutation.mutate(techs)}
        onSave={save}
        onSetField={set}
        profile={profile}
        savePending={saveMutation.isPending}
        saveSuccess={saveMutation.isSuccess}
      />
    </main>
  );
}

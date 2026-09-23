import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RANKS, rankForXp } from "@grip/core/gamification";
import { LOCALE_LABELS, t } from "@grip/core/i18n";
import { EMPTY_PROFILE_FORM, PROFILE_FIELDS, profileFormToUpdate, profileToForm } from "@grip/core/user";
import { supabase } from "@/lib/supabase";
import { changeLocale, useLocale } from "@/lib/useLocale";
import { colors, font, layout, radius, space, tints, shadow } from "@/theme";
import { Button, Field, HeaderAction, Screen, ScreenHeader, inputStyle } from "@/components/ui";
import {
  useAuthIdentitiesQuery,
  useGithubPrepMutation,
  useLinkGitHubMutation,
  useProfileQuery,
  useResetScoresMutation,
  useSaveCvTechsMutation,
  useSaveProfileMutation,
} from "@/queries/profile";
import { CvImportError, importCvTechs } from "@/lib/cvImport";
import { ProfileNextUp } from "@/components/profile/ProfileNextUp";

type ProfileForm = Record<string, string>;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE_FORM);
  // Autosave feedback: the field that just saved, and a failed save for the field that caused it.
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ key: string; message: string } | null>(null);
  // The field being typed in survives the refresh that follows another field's save.
  const editingKey = useRef<string | null>(null);
  const inputs = useRef<Record<string, TextInput | null>>({});
  const locale = useLocale();
  const { data: profile = null, error: loadError } = useProfileQuery();
  const { data: identities = [], error: identitiesError } = useAuthIdentitiesQuery();
  const githubIdentityUrl = githubUrlFromIdentities(identities);
  const displayGithubUrl = profile?.githubUrl || githubIdentityUrl;
  // "Connected" means a real GitHub OAuth identity is linked — not merely that a
  // githubUrl exists, since that can be a hand-typed/saved profile field.
  const githubConnected = identities.some((identity) => identity.provider === "github");
  const saveMutation = useSaveProfileMutation();
  const linkGitHubMutation = useLinkGitHubMutation();
  const githubPrepMutation = useGithubPrepMutation(profile, displayGithubUrl);
  const cvTechsMutation = useSaveCvTechsMutation();
  const resetMutation = useResetScoresMutation(profile);

  const onImportCv = async () => {
    try {
      const result = await importCvTechs();
      if (result.kind === "techs") cvTechsMutation.mutate(result.techs);
      else if (result.kind === "empty") Alert.alert(t("profile.cvSection"), t("profile.cvNoTechs"));
      else if (result.kind === "pdf-unsupported") Alert.alert(t("profile.cvSection"), t("profile.cvPdfMobile"));
    } catch (err) {
      Alert.alert(t("profile.cvSection"), err instanceof CvImportError ? t("profile.cvReadError") : t("profile.cvReadError"));
    }
  };

  useEffect(() => {
    if (!profile) return;
    const next = profileToForm(profile) as ProfileForm;
    if (!next.githubUrl && displayGithubUrl) next.githubUrl = displayGithubUrl;
    setForm((current) => (editingKey.current ? { ...next, [editingKey.current]: current[editingKey.current] ?? "" } : next));
  }, [profile, displayGithubUrl]);

  useEffect(() => {
    if (!savedKey) return;
    const timer = setTimeout(() => setSavedKey(null), 2000);
    return () => clearTimeout(timer);
  }, [savedKey]);

  const changeField = (key: string, value: string) => {
    editingKey.current = key;
    setForm((current) => ({ ...current, [key]: value }));
  };
  // Autosave, as on web: a field saves when you leave it, only if it changed.
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
  const completionItems = PROFILE_FIELDS.filter((field) => (form[field.key] ?? "").trim()).length;
  const completionPct = Math.round((completionItems / PROFILE_FIELDS.length) * 100);
  const firstEmpty = PROFILE_FIELDS.find((field) => !(form[field.key] ?? "").trim());
  const nextUp = firstEmpty
    ? {
        title: t("profile.nextFieldTitle", { field: t(firstEmpty.labelKey as Parameters<typeof t>[0]).toLowerCase() }),
        sub: t("profile.nextFieldSub"),
        action: { label: t("profile.nextFieldAction"), onPress: () => inputs.current[firstEmpty.key]?.focus() },
      }
    : !(profile?.cvTechs ?? []).length
      ? { title: t("profile.nextCvTitle"), sub: t("profile.nextCvSub"), action: { label: t("profile.nextCvAction"), onPress: onImportCv } }
      : !githubConnected
        ? { title: t("profile.nextGithubTitle"), sub: t("profile.nextGithubSub"), action: { label: t("profile.nextGithubAction"), onPress: () => linkGitHubMutation.mutate() } }
        : { title: t("profile.nextDoneTitle"), sub: t("profile.nextDoneSub"), action: null };
  const rank = rankForXp(profile?.xp ?? 0);
  const next = RANKS.find((item) => item.min > rank.min);
  const progress = next ? Math.min(1, ((profile?.xp ?? 0) - rank.min) / (next.min - rank.min)) : 1;
  const resetScores = () => {
    Alert.alert(t("profile.resetTitle"), t("profile.resetConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("profile.resetScore"), style: "destructive", onPress: () => resetMutation.mutate() },
    ]);
  };
  // Save failures show on their field instead.
  const error = loadError || identitiesError || linkGitHubMutation.error || githubPrepMutation.error || resetMutation.error;

  return (
    <Screen>
      <ScreenHeader
        title={t("tabs.profile")}
        subtitle={t("screen.profileSubtitle")}
        right={<HeaderAction label={t("auth.signOut")} tone="muted" onPress={() => supabase.auth.signOut()} />}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: insets.bottom + layout.tabBarClearance }}
        keyboardShouldPersistTaps="handled"
        // Scrolls a focused field above the keyboard, including one Next Up focused.
        automaticallyAdjustKeyboardInsets
      >
        {error && <Text style={{ color: colors.dangerBright, fontSize: font.size.body }}>{error.message}</Text>}

        <ProfileNextUp title={nextUp.title} sub={nextUp.sub} action={nextUp.action} disabled={!profile} />

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, boxShadow: shadow.card, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.onAccent, fontSize: font.size.title, fontWeight: "800" }}>
                {(profile?.displayName || profile?.email || "?").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.textBright, fontSize: font.size.title, fontWeight: "800" }} numberOfLines={1}>
                {profile?.displayName || t("profile.yourProfile")}
              </Text>
              {/* A demo user has no email; only a profile still loading says so. */}
              {(!profile || !!profile.email) && (
                <Text style={{ color: colors.textDim, fontSize: font.size.small }} numberOfLines={1}>
                  {profile ? profile.email : t("profile.loading")}
                </Text>
              )}
            </View>
          </View>

          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: space.xs }}>
              <Text style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: "700" }}>{t(`enum.rank.${rank.name}` as Parameters<typeof t>[0])}</Text>
              <Text style={{ color: colors.textDim, fontSize: font.size.small }}>{profile?.xp ?? 0} XP</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.bgDeep, borderRadius: radius.pill, overflow: "hidden" }}>
              <View style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: colors.accent }} />
            </View>
            <Text style={{ color: colors.textFaint, fontSize: font.size.small, marginTop: space.xs }}>
              {next ? t("profile.xpToNext", { xp: next.min - (profile?.xp ?? 0), rank: t(`enum.rank.${next.name}` as Parameters<typeof t>[0]) }) : t("profile.topRank")}
            </Text>
          </View>

          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: space.xs }}>
              <Text style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: "700" }}>{t("profile.completionLabel")}</Text>
              <Text style={{ color: colors.textDim, fontSize: font.size.small }}>{completionPct}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.bgDeep, borderRadius: radius.pill, overflow: "hidden" }}>
              <View style={{ width: `${completionPct}%`, height: "100%", backgroundColor: colors.success }} />
            </View>
            <Text style={{ color: colors.textFaint, fontSize: font.size.small, marginTop: space.xs }}>
              {t("profile.fields", { filled: completionItems, total: PROFILE_FIELDS.length })}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, boxShadow: shadow.card, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
            <Text style={{ color: colors.textBright, fontSize: font.size.title, fontWeight: "800" }}>GitHub</Text>
            <ConnectionBadge connected={githubConnected} />
          </View>
          <Text style={{ color: colors.textFaint, fontSize: font.size.small, lineHeight: 18 }}>
            {githubConnected ? t("profile.githubLinkedBlurb") : t("profile.githubUnlinkedBlurb")}
          </Text>
          {!!displayGithubUrl && (
            <Text style={{ color: colors.accentBright, fontSize: font.size.small }} numberOfLines={1}>
              {displayGithubUrl}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => linkGitHubMutation.mutate()}
            disabled={githubConnected || linkGitHubMutation.isPending || !profile}
            style={{
              borderWidth: 1,
              borderColor: githubConnected ? colors.success : colors.border,
              borderRadius: radius.sm,
              paddingVertical: space.sm,
              alignItems: "center",
              opacity: linkGitHubMutation.isPending || !profile ? 0.5 : 1,
            }}
          >
            <Text style={{ color: githubConnected ? colors.successBright : colors.textBright, fontSize: font.size.body, fontWeight: "800" }}>
              {githubConnected ? t("profile.githubConnectedButton") : linkGitHubMutation.isPending ? t("profile.githubOpening") : t("profile.githubConnectButton")}
            </Text>
          </TouchableOpacity>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: font.size.body, fontWeight: "800" }}>{t("profile.useGithubLabel")}</Text>
              <Text style={{ color: colors.textFaint, fontSize: font.size.small, lineHeight: 18, marginTop: 2 }}>
                {t("profile.useGithubSub")}
              </Text>
            </View>
            <Switch
              checked={!!profile?.useGithubTechsForPrep}
              disabled={!githubConnected || !displayGithubUrl || githubPrepMutation.isPending}
              onChange={(checked) => githubPrepMutation.mutate(checked)}
            />
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, boxShadow: shadow.card, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <Text style={{ color: colors.textBright, fontSize: font.size.title, fontWeight: "800" }}>{t("profile.cvSection")}</Text>
          <Text style={{ color: colors.textFaint, fontSize: font.size.small, lineHeight: 18 }}>
            {t("profile.cvSubtitleMobile")}
          </Text>
          <Button
            label={cvTechsMutation.isPending ? t("profile.cvReading") : t("profile.cvImportButton")}
            onPress={onImportCv}
            disabled={cvTechsMutation.isPending || !profile}
          />
          {!!profile?.cvTechs?.length && (
            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textBright, fontSize: font.size.small, fontWeight: "800" }}>{t("profile.cvDetected")}</Text>
                <TouchableOpacity onPress={() => cvTechsMutation.mutate([])} disabled={cvTechsMutation.isPending}>
                  <Text style={{ color: colors.textFaint, fontSize: font.size.small, fontWeight: "700" }}>{t("profile.cvClear")}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {profile.cvTechs.map((tech) => (
                  <View
                    key={tech}
                    style={{
                      paddingHorizontal: space.md,
                      paddingVertical: space.xs,
                      borderRadius: radius.pill,
                      backgroundColor: tints.accentSoft,
                      borderWidth: 1,
                      borderColor: colors.accent,
                    }}
                  >
                    <Text style={{ color: colors.accentBright, fontSize: font.size.small, fontWeight: "700" }}>{tech}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, boxShadow: shadow.card, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <Field label={t("profile.email")}>
            <TextInput editable={false} value={profile?.email ?? ""} style={[inputStyle, { color: colors.textDim }]} />
          </Field>

          <Text style={{ color: colors.textFaint, fontSize: font.size.label, fontWeight: "700" }}>{`✓ ${t("profile.autosaveHint")}`}</Text>
          {PROFILE_FIELDS.map((field) => (
            <Field key={field.key} label={t(field.labelKey as Parameters<typeof t>[0])}>
              <TextInput
                ref={(input) => { inputs.current[field.key] = input; }}
                value={form[field.key]}
                editable={!!profile}
                onChangeText={(value) => changeField(field.key, value)}
                onBlur={() => commitField(field.key)}
                onSubmitEditing={() => commitField(field.key)}
                returnKeyType="done"
                placeholder={t(field.placeholderKey as Parameters<typeof t>[0])}
                placeholderTextColor={colors.textFaint}
                keyboardType={field.keyboardType === "url" ? "url" : "default"}
                autoCapitalize="none"
                autoCorrect={false}
                style={inputStyle}
              />
              {savedKey === field.key && (
                <Text accessibilityLiveRegion="polite" style={{ color: colors.successBright, fontSize: font.size.label, fontWeight: "700" }}>{t("profile.savedCheck")}</Text>
              )}
              {fieldError?.key === field.key && (
                <Text accessibilityRole="alert" style={{ color: colors.dangerBright, fontSize: font.size.label }}>{fieldError.message}</Text>
              )}
            </Field>
          ))}
        </View>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, boxShadow: shadow.card, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <Text style={{ color: colors.textBright, fontSize: font.size.title, fontWeight: "800" }}>{t("profile.preferences")}</Text>
          <Text style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: "800" }}>{t("profile.language")}</Text>
          <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
            {(Object.entries(LOCALE_LABELS) as [string, string][]).map(([code, label]) => {
              const active = locale === code;
              return (
                <TouchableOpacity
                  key={code}
                  accessibilityLabel={label}
                  onPress={() => changeLocale(code)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? `${colors.accent}22` : "transparent",
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  {/* The language's own name: flag emoji don't render on every device. */}
                  <Text style={{ fontSize: font.size.body, fontWeight: "700", color: active ? colors.textBright : colors.textDim }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md, gap: space.xs }}>
            <Text style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: "800" }}>{t("profile.resetTitle")}</Text>
            <Text style={{ color: colors.textFaint, fontSize: font.size.small, lineHeight: 18 }}>{t("profile.resetSub")}</Text>
            <TouchableOpacity
              onPress={resetScores}
              disabled={!profile || resetMutation.isPending}
              style={{
                marginTop: space.sm,
                borderWidth: 1,
                borderColor: `${colors.danger}60`,
                borderRadius: radius.sm,
                paddingVertical: space.sm,
                alignItems: "center",
                opacity: !profile || resetMutation.isPending ? 0.5 : 1,
              }}
            >
              <Text style={{ color: colors.dangerBright, fontSize: font.size.body, fontWeight: "800" }}>
                {resetMutation.isPending ? t("profile.resetting") : t("profile.resetScore")}
              </Text>
            </TouchableOpacity>
            {resetMutation.isSuccess && (
              <Text style={{ color: colors.successBright, fontSize: font.size.small, fontWeight: "700" }}>{t("profile.scoreReset")}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/about")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSoft, boxShadow: shadow.card,
            borderRadius: radius.md,
            padding: space.lg,
          }}
        >
          <View>
            <Text style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: "800" }}>{t("about.profileLinkTitle")}</Text>
            <Text style={{ color: colors.textFaint, fontSize: font.size.small, marginTop: 2 }}>{t("about.profileLinkSubtitle")}</Text>
          </View>
          <Text style={{ color: colors.textFaint, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function githubUrlFromIdentities(identities: { provider?: string; identity_data?: Record<string, unknown> }[]) {
  const github = identities.find((identity) => identity.provider === "github");
  const data = github?.identity_data ?? {};
  const username = [data.user_name, data.preferred_username, data.login].find(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );
  return username ? `https://github.com/${username}` : "";
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: radius.pill,
        backgroundColor: connected ? tints.successSoft : colors.surfaceHi,
        borderWidth: 1,
        borderColor: connected ? colors.success : colors.border,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? colors.successBright : colors.textFaint }} />
      <Text style={{ color: connected ? colors.successBright : colors.textFaint, fontSize: font.size.label, fontWeight: "800" }}>
        {connected ? t("profile.connectionLinked") : t("profile.connectionOptional")}
      </Text>
    </View>
  );
}

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      onPress={() => onChange(!checked)}
      disabled={disabled}
      style={{
        width: 48,
        height: 28,
        padding: 3,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: checked ? colors.accent : colors.border,
        backgroundColor: checked ? colors.accent : colors.bgDeep,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: checked ? colors.onAccent : colors.textFaint,
          transform: [{ translateX: checked ? 20 : 0 }],
        }}
      />
    </TouchableOpacity>
  );
}

import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RANKS, rankForXp } from "@grip-apps/core/gamification";
import { LOCALE_LABELS, t } from "@grip-apps/core/i18n";
import { EMPTY_PROFILE_FORM, PROFILE_FIELDS, profileFormToUpdate, profileToForm } from "@grip-apps/core/user";
import { supabase } from "@/lib/supabase";
import { changeLocale, useLocale } from "@/lib/useLocale";
import { colors, font, layout, radius, space, tints } from "@/theme";
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

type ProfileForm = Record<string, string>;

const LOCALE_EMOJI: Record<string, string> = { en: "🇺🇸", pt: "🇧🇷", sv: "🇸🇪" };

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE_FORM);
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
    setForm(next);
  }, [profile, displayGithubUrl]);

  const set = (key: string) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const rank = rankForXp(profile?.xp ?? 0);
  const next = RANKS.find((item) => item.min > rank.min);
  const progress = next ? Math.min(1, ((profile?.xp ?? 0) - rank.min) / (next.min - rank.min)) : 1;
  const resetScores = () => {
    Alert.alert("Reset score?", "This clears all XP and answer history. It cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => resetMutation.mutate() },
    ]);
  };
  const error = loadError || identitiesError || saveMutation.error || linkGitHubMutation.error || githubPrepMutation.error || resetMutation.error;

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
      >
        {error && <Text style={{ color: colors.dangerBright, fontSize: font.size.body }}>{error.message}</Text>}

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
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
                {profile?.displayName || "Your profile"}
              </Text>
              <Text style={{ color: colors.textDim, fontSize: font.size.small }} numberOfLines={1}>
                {profile?.email || "Loading..."}
              </Text>
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
            <TouchableOpacity
              onPress={resetScores}
              disabled={!profile || resetMutation.isPending}
              style={{
                marginTop: space.md,
                borderWidth: 1,
                borderColor: `${colors.danger}60`,
                borderRadius: radius.sm,
                paddingVertical: space.sm,
                alignItems: "center",
                opacity: !profile || resetMutation.isPending ? 0.5 : 1,
              }}
            >
              <Text style={{ color: colors.dangerBright, fontSize: font.size.body, fontWeight: "800" }}>
                {resetMutation.isPending ? "Resetting..." : "Reset score"}
              </Text>
            </TouchableOpacity>
            {resetMutation.isSuccess && (
              <Text style={{ color: colors.successBright, fontSize: font.size.small, fontWeight: "700", marginTop: space.xs }}>
                Score reset
              </Text>
            )}
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
            <Text style={{ color: colors.textBright, fontSize: font.size.title, fontWeight: "800" }}>GitHub</Text>
            <ConnectionBadge connected={githubConnected} />
          </View>
          <Text style={{ color: colors.textFaint, fontSize: font.size.small, lineHeight: 18 }}>
            {githubConnected
              ? "GitHub is linked to this protected workspace."
              : "Link GitHub while signed in to keep this same protected workspace."}
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
              {githubConnected ? "GitHub connected" : linkGitHubMutation.isPending ? "Opening GitHub..." : "Connect GitHub"}
            </Text>
          </TouchableOpacity>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: font.size.body, fontWeight: "800" }}>Use for prep recommendations</Text>
              <Text style={{ color: colors.textFaint, fontSize: font.size.small, lineHeight: 18, marginTop: 2 }}>
                Show the From GitHub techs category on Interview Prep.
              </Text>
            </View>
            <Switch
              checked={!!profile?.useGithubTechsForPrep}
              disabled={!githubConnected || !displayGithubUrl || githubPrepMutation.isPending}
              onChange={(checked) => githubPrepMutation.mutate(checked)}
            />
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
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

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
          <Field label={t("profile.email")}>
            <TextInput editable={false} value={profile?.email ?? ""} style={[inputStyle, { color: colors.textDim }]} />
          </Field>

          {PROFILE_FIELDS.map((field) => (
            <Field key={field.key} label={t(field.labelKey as Parameters<typeof t>[0])}>
              <TextInput
                value={form[field.key]}
                onChangeText={set(field.key)}
                placeholder={t(field.placeholderKey as Parameters<typeof t>[0])}
                placeholderTextColor={colors.textFaint}
                keyboardType={field.keyboardType === "url" ? "url" : "default"}
                autoCapitalize="none"
                autoCorrect={false}
                style={inputStyle}
              />
            </Field>
          ))}

          <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: space.md }}>
            {saveMutation.isSuccess && <Text style={{ color: colors.successBright, fontSize: font.size.small, fontWeight: "700" }}>Saved</Text>}
            <Button
              label={saveMutation.isPending ? t("common.saving") : t("common.save")}
              onPress={() => saveMutation.mutate(profileFormToUpdate(form))}
              disabled={!profile || saveMutation.isPending}
            />
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.lg, gap: space.md }}>
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
                  <Text style={{ fontSize: 22 }}>{LOCALE_EMOJI[code]}</Text>
                </TouchableOpacity>
              );
            })}
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
            borderColor: colors.border,
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
        {connected ? "Linked" : "Optional"}
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

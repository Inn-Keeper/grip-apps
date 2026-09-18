import { PROFILE_FIELDS } from "@grip/core/user";
import { colors, layout } from "@grip/core/tokens";
import { LOCALE_FLAGS, LOCALE_LABELS, t } from "@grip/core/i18n";
import { BrandIcon } from "../components/BrandIcon";
import { ConnectionBadge, MetaLabel, Panel, Switch } from "./shared";
import type { ProfileForm, ProfileRecord, Rank } from "./types";

export function ProfileAside({
  completionItems,
  completionPct,
  form,
  githubConnected,
  githubPrepPending,
  linkPending,
  locale,
  onGithubPrepChange,
  onLinkGitHub,
  onLocaleChange,
  onPoeVisibilityChange,
  onResetScores,
  onSignOut,
  poeVisible,
  profile,
  rank,
  resetPending,
  resetSuccess,
  next,
}: {
  completionItems: number;
  completionPct: number;
  form: ProfileForm;
  githubConnected: boolean;
  githubPrepPending: boolean;
  linkPending: boolean;
  locale: string;
  onGithubPrepChange: (checked: boolean) => void;
  onLinkGitHub: () => void;
  onLocaleChange: (code: string) => void;
  onPoeVisibilityChange: (checked: boolean) => void;
  onResetScores: () => void;
  onSignOut?: () => void;
  poeVisible: boolean;
  profile: ProfileRecord | null;
  rank: Rank;
  resetPending: boolean;
  resetSuccess: boolean;
  next?: Rank;
}) {
  return (
    <aside
      style={{
        borderRight: `1px solid ${colors.borderSoft}`,
        background: colors.bgDeep,
        flex: "0 0 340px",
        minHeight: `calc(100vh - ${layout.webHeaderHeight}px)`,
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: colors.accent,
            color: colors.onAccent,
            display: "grid",
            placeItems: "center",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          {(profile?.displayName || profile?.email || "?").slice(0, 1).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, color: colors.textBright, fontSize: 20, fontWeight: 800 }}>
            {profile?.displayName || t("profile.yourProfile")}
          </h1>
          <p style={{ margin: "3px 0 0", color: colors.textFaint, fontSize: 12, overflowWrap: "anywhere" }}>
            {profile?.email || t("profile.loading")}
          </p>
        </div>
      </div>

      <Panel>
        <MetaLabel>{t("profile.rank")}</MetaLabel>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <strong style={{ color: colors.textBright, fontSize: 24 }}>{t(`enum.rank.${rank.name}` as Parameters<typeof t>[0])}</strong>
          <span style={{ color: colors.textDim, fontSize: 12, fontWeight: 700 }}>{profile?.xp ?? 0} XP</span>
        </div>
        <div style={{ height: 8, background: colors.well, borderRadius: 999, overflow: "hidden", marginTop: 12 }}>
          <div
            style={{
              height: "100%",
              width: next ? `${Math.min(100, (((profile?.xp ?? 0) - rank.min) / (next.min - rank.min)) * 100)}%` : "100%",
              background: colors.accent,
            }}
          />
        </div>
        <p style={{ margin: "8px 0 0", color: colors.textFaint, fontSize: 12 }}>
          {next ? t("profile.xpToNext", { xp: next.min - (profile?.xp ?? 0), rank: t(`enum.rank.${next.name}` as Parameters<typeof t>[0]) }) : t("profile.topRank")}
        </p>
        <button
          onClick={onResetScores}
          disabled={resetPending || !profile}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "8px 12px",
            background: "transparent",
            border: `1px solid ${colors.danger}60`,
            borderRadius: 8,
            color: colors.dangerBright,
            fontSize: 12,
            fontWeight: 800,
            cursor: resetPending || !profile ? "wait" : "pointer",
            opacity: resetPending || !profile ? 0.6 : 1,
          }}
        >
          {resetPending ? t("profile.resetting") : t("profile.resetScore")}
        </button>
        {resetSuccess && (
          <p style={{ margin: "8px 0 0", color: colors.successBright, fontSize: 12, fontWeight: 700 }}>
            {t("profile.scoreReset")}
          </p>
        )}
      </Panel>

      <Panel>
        <MetaLabel>{t("profile.profileCompletion")}</MetaLabel>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <strong style={{ color: colors.textBright, fontSize: 22 }}>{completionPct}%</strong>
          <span style={{ color: colors.textDim, fontSize: 12, fontWeight: 700 }}>
            {t("profile.fields", { filled: completionItems, total: PROFILE_FIELDS.length })}
          </span>
        </div>
        <div style={{ height: 8, background: colors.well, borderRadius: 999, overflow: "hidden", marginTop: 12 }}>
          <div style={{ height: "100%", width: `${completionPct}%`, background: colors.success }} />
        </div>
        <p style={{ margin: "8px 0 0", color: colors.textFaint, fontSize: 12 }}>
          {t("profile.profileSubtitle")}
        </p>
      </Panel>

      <Panel>
        <MetaLabel>{t("profile.connections")}</MetaLabel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <strong style={{ color: colors.textBright, fontSize: 18 }}>GitHub</strong>
          <ConnectionBadge connected={githubConnected} />
        </div>
        <p style={{ margin: "8px 0 0", color: colors.textFaint, fontSize: 12, lineHeight: 1.5 }}>
          {githubConnected ? t("profile.githubLinkedBlurb") : t("profile.githubUnlinkedBlurb")}
        </p>
        {githubConnected && form.githubUrl && (
          <a
            href={form.githubUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              marginTop: 10,
              color: colors.accentBright,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              overflowWrap: "anywhere",
            }}
          >
            {form.githubUrl}
          </a>
        )}
        <button
          onClick={onLinkGitHub}
          disabled={githubConnected || linkPending || !profile}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "9px 12px",
            background: githubConnected ? "transparent" : colors.surfaceHi,
            border: `1px solid ${githubConnected ? colors.success : colors.borderSoft}`,
            borderRadius: 8,
            color: githubConnected ? colors.successBright : colors.textBright,
            fontSize: 12,
            fontWeight: 800,
            cursor: githubConnected || linkPending || !profile ? "default" : "pointer",
            opacity: linkPending || !profile ? 0.6 : 1,
          }}
        >
          {githubConnected ? t("profile.githubConnectedButton") : linkPending ? t("profile.githubOpening") : t("profile.githubConnectButton")}
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${colors.borderSoft}`,
            color: githubConnected && form.githubUrl ? colors.text : colors.textFaint,
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          <span>
            <span style={{ display: "block", fontWeight: 800 }}>{t("profile.useGithubLabel")}</span>
            <span style={{ display: "block", marginTop: 3, color: colors.textFaint }}>
              {t("profile.useGithubSub")}
            </span>
          </span>
          <Switch
            checked={!!profile?.useGithubTechsForPrep}
            disabled={!githubConnected || !form.githubUrl || githubPrepPending}
            label={t("profile.useGithubLabel")}
            onChange={onGithubPrepChange}
          />
        </div>
      </Panel>

      <Panel>
        <MetaLabel>{t("profile.preferences")}</MetaLabel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: colors.text, fontSize: 12, lineHeight: 1.45 }}>
            <span style={{ display: "block", color: colors.textBright, fontWeight: 800 }}>{t("profile.poeLabel")}</span>
            <span style={{ display: "block", marginTop: 3, color: colors.textFaint }}>{t("profile.poeSub")}</span>
          </span>
          <Switch
            checked={poeVisible}
            disabled={false}
            label={t("profile.poeLabel")}
            onChange={onPoeVisibilityChange}
          />
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.borderSoft}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: colors.textBright, marginBottom: 10 }}>
            {t("profile.language")}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(Object.entries(LOCALE_LABELS) as [string, string][]).map(([code, label]) => {
              const active = locale === code;
              return (
                <button
                  key={code}
                  title={label}
                  onClick={() => onLocaleChange(code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "5px 8px",
                    background: active ? colors.accent : "transparent",
                    border: `1px solid ${active ? colors.accent : colors.borderSoft}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  <BrandIcon name={(LOCALE_FLAGS as Record<string, string>)[code] ?? "globe"} size={20} />
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, color: colors.textFaint, fontSize: 12, lineHeight: 1.6 }}>
          {t("profile.privateNote")}
        </p>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            style={{
              width: "100%",
              padding: "9px 12px",
              background: "transparent",
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8,
              color: colors.textFaint,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}

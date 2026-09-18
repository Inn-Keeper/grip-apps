import { PROFILE_FIELDS } from "@grip/core/user";
import { LOCALE_FLAGS, LOCALE_LABELS, t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { fieldStyle as inputStyle } from "../components/fieldStyles";
import { WorkspacePanel } from "../components/WorkspaceLayout";
import { ConnectionBadge, Switch } from "./shared";
import type { ProfileForm, ProfileRecord } from "./types";

// Browser autofill and mobile keyboards per field.
const AUTOCOMPLETE: Record<string, string> = {
  displayName: "nickname",
  targetRole: "organization-title",
  location: "address-level2",
  githubUrl: "url",
  linkedinUrl: "url",
  portfolioUrl: "url",
};

// Account fields save on their own when you leave them (autosave), with the result announced beside the field.
export function AccountSection({ form, profile, savedKey, error, onChange, onCommit }: {
  form: ProfileForm;
  profile: ProfileRecord | null;
  // The field that just saved, and a failed save's message for the field that caused it (rule 13).
  savedKey: string | null;
  error: { key: string; message: string } | null;
  onChange: (key: string, value: string) => void;
  onCommit: (key: string) => void;
}) {
  return (
    <WorkspacePanel style={{ padding: 20 }}>
      <p id="profile-autosave-hint" style={{ margin: "0 0 16px", color: colors.textFaint, fontSize: font.size.small }}>{t("profile.autosaveHint")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <FieldRow id="profile-email" label={t("profile.email")} hint={t("profile.emailHint")}>
          {/* Read-only: it comes from sign-in, so it doesn't look like an editable field. */}
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            value={profile?.email ?? ""}
            readOnly
            aria-describedby="profile-email-hint"
            style={{ ...inputStyle, background: "transparent", color: colors.textDim }}
          />
        </FieldRow>
        {PROFILE_FIELDS.map((field) => {
          const id = `profile-${field.key}`;
          const fieldError = error?.key === field.key ? error.message : null;
          const isUrl = field.keyboardType === "url";
          return (
            <FieldRow key={field.key} id={id} label={t(field.labelKey as Parameters<typeof t>[0])} status={savedKey === field.key ? t("profile.savedCheck") : null} error={fieldError}>
              <input
                id={id}
                type={isUrl ? "url" : "text"}
                inputMode={isUrl ? "url" : undefined}
                autoComplete={AUTOCOMPLETE[field.key] ?? "off"}
                spellCheck={isUrl ? false : undefined}
                value={form[field.key] ?? ""}
                disabled={!profile}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={[fieldError ? `${id}-error` : null, "profile-autosave-hint"].filter(Boolean).join(" ")}
                onChange={(event) => onChange(field.key, event.target.value)}
                onBlur={() => onCommit(field.key)}
                // Enter saves and keeps focus in the field (blurring would drop keyboard users to the page).
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onCommit(field.key); } }}
                placeholder={t(field.placeholderKey as Parameters<typeof t>[0])}
                style={inputStyle}
              />
            </FieldRow>
          );
        })}
      </div>
    </WorkspacePanel>
  );
}

// Label above, field, then status/hint/error below. Status sits outside the label so it never renames the field.
function FieldRow({ id, label, hint, status, error, children }: { id: string; label: string; hint?: string; status?: string | null; error?: string | null; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <label htmlFor={id} style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textDim, letterSpacing: "0.03em" }}>{label}</label>
        <span role="status" style={{ fontSize: font.size.label, fontWeight: 700, color: colors.successBright }}>{status ?? ""}</span>
      </div>
      {children}
      {hint && <span id={`${id}-hint`} style={{ fontSize: font.size.label, color: colors.textFaint }}>{hint}</span>}
      {error && <span id={`${id}-error`} role="alert" style={{ fontSize: font.size.label, color: colors.dangerBright }}>{error}</span>}
    </div>
  );
}

export function ConnectionsSection({ form, profile, githubConnected, linkPending, githubPrepPending, onLinkGitHub, onGithubPrepChange }: {
  form: ProfileForm;
  profile: ProfileRecord | null;
  githubConnected: boolean;
  linkPending: boolean;
  githubPrepPending: boolean;
  onLinkGitHub: () => void;
  onGithubPrepChange: (checked: boolean) => void;
}) {
  return (
    <WorkspacePanel style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <strong style={{ color: colors.textBright, fontSize: font.size.bodyLg }}>GitHub</strong>
        <ConnectionBadge connected={githubConnected} />
      </div>
      <p style={{ margin: "8px 0 0", color: colors.textDim, fontSize: font.size.body, lineHeight: 1.5 }}>
        {githubConnected ? t("profile.githubLinkedBlurb") : t("profile.githubUnlinkedBlurb")}
      </p>
      {githubConnected && form.githubUrl && (
        <a href={form.githubUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 10, color: colors.accentBright, fontSize: font.size.small, fontWeight: 700, textDecoration: "none", overflowWrap: "anywhere" }}>
          {form.githubUrl}
        </a>
      )}
      <button
        type="button"
        onClick={onLinkGitHub}
        disabled={githubConnected || linkPending || !profile}
        aria-busy={linkPending}
        style={{
          marginTop: 14, padding: "10px 16px",
          background: githubConnected ? "transparent" : colors.accent,
          border: `1px solid ${githubConnected ? colors.borderSoft : colors.accent}`,
          borderRadius: 8, color: githubConnected ? colors.successBright : colors.onAccent,
          fontSize: font.size.body, fontWeight: 800,
          cursor: githubConnected || linkPending || !profile ? "default" : "pointer",
          opacity: linkPending || !profile ? 0.6 : 1,
        }}
      >
        {githubConnected ? t("profile.githubConnectedButton") : linkPending ? t("profile.githubOpening") : t("profile.githubConnectButton")}
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.borderSoft}` }}>
        <span>
          <span style={{ display: "block", color: colors.textBright, fontSize: font.size.body, fontWeight: 800 }}>{t("profile.useGithubLabel")}</span>
          <span style={{ display: "block", marginTop: 3, color: colors.textFaint, fontSize: font.size.small }}>{t("profile.useGithubSub")}</span>
        </span>
        <Switch checked={!!profile?.useGithubTechsForPrep} disabled={!githubConnected || !form.githubUrl || githubPrepPending} label={t("profile.useGithubLabel")} onChange={onGithubPrepChange} />
      </div>
    </WorkspacePanel>
  );
}

export function PreferencesSection({ poeVisible, locale, profile, resetPending, resetSuccess, onPoeVisibilityChange, onLocaleChange, onResetScores }: {
  poeVisible: boolean;
  locale: string;
  profile: ProfileRecord | null;
  resetPending: boolean;
  resetSuccess: boolean;
  onPoeVisibilityChange: (checked: boolean) => void;
  onLocaleChange: (code: string) => void;
  onResetScores: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <WorkspacePanel style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>
            <span style={{ display: "block", color: colors.textBright, fontSize: font.size.body, fontWeight: 800 }}>{t("profile.poeLabel")}</span>
            <span style={{ display: "block", marginTop: 3, color: colors.textFaint, fontSize: font.size.small }}>{t("profile.poeSub")}</span>
          </span>
          <Switch checked={poeVisible} disabled={false} label={t("profile.poeLabel")} onChange={onPoeVisibilityChange} />
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.borderSoft}` }}>
          <div style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: 800, marginBottom: 10 }}>{t("profile.language")}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(Object.entries(LOCALE_LABELS) as [string, string][]).map(([code, label]) => {
              const active = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => onLocaleChange(code)}
                  style={{ display: "flex", alignItems: "center", padding: "6px 9px", background: active ? `${colors.accent}24` : "transparent", border: `1px solid ${active ? colors.accent : colors.borderSoft}`, borderRadius: 8, cursor: "pointer", opacity: active ? 1 : 0.7 }}
                >
                  <BrandIcon name={(LOCALE_FLAGS as Record<string, string>)[code] ?? "globe"} size={20} />
                </button>
              );
            })}
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel style={{ padding: 20 }}>
        <div style={{ color: colors.textBright, fontSize: font.size.body, fontWeight: 800 }}>{t("profile.resetTitle")}</div>
        <p style={{ margin: "4px 0 12px", color: colors.textFaint, fontSize: font.size.small }}>{t("profile.resetSub")}</p>
        <button
          type="button"
          onClick={onResetScores}
          disabled={resetPending || !profile}
          aria-busy={resetPending}
          style={{ padding: "9px 14px", background: "transparent", border: `1px solid ${colors.danger}60`, borderRadius: 8, color: colors.dangerBright, fontSize: font.size.small, fontWeight: 800, cursor: resetPending || !profile ? "wait" : "pointer", opacity: resetPending || !profile ? 0.6 : 1 }}
        >
          {resetPending ? t("profile.resetting") : t("profile.resetScore")}
        </button>
        {resetSuccess && <p role="status" style={{ margin: "8px 0 0", color: colors.successBright, fontSize: font.size.small, fontWeight: 700 }}>{t("profile.scoreReset")}</p>}
      </WorkspacePanel>
    </div>
  );
}

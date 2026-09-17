import React from "react";
import { PROFILE_FIELDS } from "@grip/core/user";
import { colors, layout, tints } from "@grip/core/tokens";
import { t } from "@grip/core/i18n";
import { Field } from "./shared";
import { CvUpload } from "./CvUpload";
import { inputStyle } from "./styles";
import type { ProfileForm, ProfileRecord } from "./types";

export function ProfileFormSection({
  cvTechs,
  cvPending,
  error,
  form,
  githubLinked,
  isLoading,
  onClearCvTechs,
  onCvTechsExtracted,
  onSave,
  onSetField,
  profile,
  savePending,
  saveSuccess,
}: {
  cvTechs: string[];
  cvPending: boolean;
  error: Error | null;
  form: ProfileForm;
  githubLinked: boolean;
  isLoading: boolean;
  onClearCvTechs: () => void;
  onCvTechsExtracted: (techs: string[]) => void;
  onSave: (event: React.FormEvent) => void;
  onSetField: (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  profile: ProfileRecord | null;
  savePending: boolean;
  saveSuccess: boolean;
}) {
  return (
    <section
      style={{
        minWidth: 0,
        flex: "1 1 680px",
        minHeight: `calc(100vh - ${layout.webHeaderHeight}px)`,
        padding: "56px clamp(28px, 6vw, 96px)",
        overflow: "auto",
      }}
    >
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 10 }}>
          <div>
            <p style={{ margin: "0 0 8px", color: colors.textFaint, fontSize: 13, fontWeight: 700 }}>{t("profile.account")}</p>
            <h2 style={{ margin: 0, fontSize: 34, lineHeight: 1.12, fontWeight: 800, color: colors.textBright }}>
              {t("profile.settings")}
            </h2>
          </div>
          {isLoading && (
            <span style={{ marginLeft: "auto", fontSize: 12, color: colors.textFaint, fontWeight: 600 }}>
              {t("common.loading")}
            </span>
          )}
        </div>
        <p style={{ maxWidth: 760, margin: "0 0 30px", color: colors.textDim, fontSize: 15, lineHeight: 1.7 }}>
          {t("profile.settingsSubtitle")}
        </p>

        {error && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              background: tints.dangerSoft,
              border: `1px solid ${colors.danger}60`,
              borderRadius: 8,
              color: colors.dangerBright,
              fontSize: 13,
            }}
          >
            {error.message}
          </div>
        )}

        {githubLinked && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              background: tints.successSoft,
              border: `1px solid ${colors.success}60`,
              borderRadius: 8,
              color: colors.successBright,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {t("profile.githubConnectedBanner")}
          </div>
        )}

        <form
          onSubmit={onSave}
          style={{
            borderTop: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`,
            padding: "24px 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <Field label={t("profile.email")}>
            <input value={profile?.email ?? ""} readOnly style={{ ...inputStyle, color: colors.textDim }} />
          </Field>

          {PROFILE_FIELDS.map((field) => (
            <Field key={field.key} label={t(field.labelKey as Parameters<typeof t>[0])}>
              <input
                value={form[field.key] ?? ""}
                onChange={onSetField(field.key)}
                placeholder={t(field.placeholderKey as Parameters<typeof t>[0])}
                style={inputStyle}
              />
            </Field>
          ))}

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            {saveSuccess && (
              <span style={{ alignSelf: "center", color: colors.successBright, fontSize: 12, fontWeight: 700 }}>{t("profile.saved")}</span>
            )}
            <button
              type="submit"
              disabled={savePending || !profile}
              style={{
                padding: "10px 18px",
                background: colors.accent,
                border: "none",
                borderRadius: 8,
                color: colors.onAccent,
                fontSize: 13,
                fontWeight: 800,
                cursor: savePending ? "wait" : "pointer",
                opacity: savePending || !profile ? 0.6 : 1,
              }}
            >
              {savePending ? t("profile.saving") : t("profile.saveProfile")}
            </button>
          </div>
        </form>

        <CvUpload
          cvTechs={cvTechs}
          disabled={!profile}
          pending={cvPending}
          onTechsExtracted={onCvTechsExtracted}
          onClear={onClearCvTechs}
        />
      </div>
    </section>
  );
}

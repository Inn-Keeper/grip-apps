import { t } from "@grip/core/i18n";
import { colors, font } from "../lib/tokens";
import { ErrorText } from "./ErrorText";

// Cancel and Save for an inline form, with the pending label and the failure beside Save.
export function FormActions({ saveLabel = t("common.save"), canSave, saving, error, compact = false, onSave, onCancel }: {
  saveLabel?: string;
  canSave: boolean;
  saving: boolean;
  error: string | null;
  compact?: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const enabled = canSave && !saving;
  const base = { padding: compact ? "6px 14px" : "8px 16px", borderRadius: 8, fontSize: compact ? font.size.small : font.size.body, fontWeight: 600 } as const;
  return (
    <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        justifyContent: "flex-end",
        marginTop: compact ? 0 : 4
      }}>
      {error && <div style={{ flex: "1 1 200px" }}><ErrorText>{error}</ErrorText></div>}
      <button type="button" onClick={onCancel} disabled={saving} style={{
          ...base,
          background: "transparent",
          border: `1px solid ${colors.borderSoft}`,
          color: colors.textDim,
          cursor: saving ? "not-allowed" : "pointer"
        }}>
        {t("common.cancel")}
      </button>
      <button type="button" onClick={onSave} disabled={!enabled} aria-busy={saving} style={{
          ...base,
          background: colors.accent,
          border: "none",
          color: colors.onAccent,
          cursor: enabled ? "pointer" : "not-allowed",
          opacity: enabled ? 1 : 0.5
        }}>
        {saving ? `${t("common.saving")}…` : saveLabel}
      </button>
    </div>
  );
}

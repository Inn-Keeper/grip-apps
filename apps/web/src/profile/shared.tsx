import React from "react";
import { colors, tints, font } from "@grip/core/tokens";
import { t } from "@grip/core/i18n";

export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        background: connected ? tints.successSoft : colors.surfaceHi,
        border: `1px solid ${connected ? colors.success : colors.borderSoft}`,
        color: connected ? colors.successBright : colors.textFaint,
        fontSize: font.size.label,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: connected ? colors.successBright : colors.textFaint,
        }}
      />
      {connected ? t("profile.connectionLinked") : t("profile.connectionOptional")}
    </span>
  );
}

export function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        padding: 3,
        flex: "0 0 auto",
        borderRadius: 999,
        border: `1px solid ${checked ? colors.accent : colors.borderSoft}`,
        background: checked ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})` : colors.bgDeep,
        boxShadow: checked
          ? `0 0 0 3px ${colors.accent}1F, 0 8px 18px ${colors.accent}22`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width: 20,
          height: 20,
          borderRadius: 999,
          background: checked ? colors.onAccent : colors.textFaint,
          boxShadow: checked ? "0 4px 12px rgba(0,0,0,0.28)" : "0 3px 9px rgba(0,0,0,0.35)",
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.18s ease",
        }}
      />
    </button>
  );
}



export { Field } from "../components/shared";

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

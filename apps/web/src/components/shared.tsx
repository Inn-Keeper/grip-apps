import React from "react";
import { colors, space, font } from "@grip/core/tokens";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: space.xs + 2, minWidth: 0 }}>
      <span
        style={{
          fontSize: font.size.label,
          fontWeight: "700",
          color: colors.textDim,
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

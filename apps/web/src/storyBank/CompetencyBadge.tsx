import React from "react";
import { COMPETENCY_COLORS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { alpha, colors, font } from "../lib/tokens";

export function CompetencyBadge({ competency }: { competency: string }) {
  const color = COMPETENCY_COLORS[competency] || colors.textFaint;
  const label = competency ? t(`enum.competency.${competency}` as Parameters<typeof t>[0]) : "";
  return (
    <span
      style={{
        padding: "3px 10px",
        background: alpha(color, 0.13),
        borderRadius: 20,
        color,
        fontSize: font.size.label,
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

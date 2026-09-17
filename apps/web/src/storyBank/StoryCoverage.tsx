import React from "react";
import { COMPETENCIES, COMPETENCY_COLORS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Story } from "./types";

export function StoryCoverage({ stories }: { stories: Story[] }) {
  const counts = Object.fromEntries(
    COMPETENCIES.map((competency) => [competency, stories.filter((s) => s.competency === competency).length])
  );
  const covered = COMPETENCIES.filter((competency) => (counts[competency] ?? 0) > 0).length;

  return (
    <WorkspacePanel>
      <WorkspaceTitle
        icon={<BrandIcon name="accuracy" color={colors.successBright} size={17} />}
        title={t("stories.coverage")}
        subtitle={t("stories.coverageSubtitle", { covered, total: COMPETENCIES.length })}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        {COMPETENCIES.map((competency) => {
          const color = COMPETENCY_COLORS[competency] || colors.textFaint;
          return (
            <div key={competency} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: counts[competency] ? color : colors.border,
                }}
              />
              <span style={{ flex: 1, color: counts[competency] ? colors.text : colors.textFaint }}>{t(`enum.competency.${competency}` as Parameters<typeof t>[0])}</span>
              <span style={{ color: counts[competency] ? color : colors.textFaint, fontWeight: 850 }}>
                {counts[competency]}
              </span>
            </div>
          );
        })}
      </div>
    </WorkspacePanel>
  );
}

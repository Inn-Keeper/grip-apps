import { COMPETENCIES, COMPETENCY_COLORS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { HeadlineMetric } from "../components/HeadlineMetric";
import { WorkspacePanel } from "../components/WorkspaceLayout";
import type { Story } from "./types";

// Right rail: the headline (competencies covered), then which ones (rules 5, 17).
export function StoryCoverage({ stories }: { stories: Story[] }) {
  const counts = Object.fromEntries(COMPETENCIES.map((competency) => [competency, stories.filter((s) => s.competency === competency).length]));
  const covered = COMPETENCIES.filter((competency) => (counts[competency] ?? 0) > 0).length;

  return (
    <WorkspacePanel>
      <HeadlineMetric
        label={t("stories.coverageLabel")}
        value={covered}
        unit={`/${COMPETENCIES.length}`}
        pct={(covered / COMPETENCIES.length) * 100}
        hint={t("stories.coverageHint")}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {COMPETENCIES.map((competency) => {
          const color = COMPETENCY_COLORS[competency] || colors.textFaint;
          const count = counts[competency] ?? 0;
          return (
            <div key={competency} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: font.size.small }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: count ? color : colors.borderSoft }} />
              <span style={{ flex: 1, color: count ? colors.text : colors.textFaint }}>{t(`enum.competency.${competency}` as Parameters<typeof t>[0])}</span>
              <span style={{ color: count ? color : colors.textFaint, fontWeight: 800 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </WorkspacePanel>
  );
}

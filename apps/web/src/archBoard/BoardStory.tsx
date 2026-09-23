import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { Combobox } from "../components/Combobox";
import { CompetencyBadge } from "../storyBank/CompetencyBadge";
import { StarSections } from "../storyBank/StoryCard";
import { useStoriesQuery } from "../storyBank/queries";

// The story this board is designed for: picked from the stories linked to the scenario,
// with its STAR one click away, since that's the situation the talk track should tell.
export function BoardStory({ scenarioId, storyId, onChange }: {
  scenarioId: string;
  storyId: string | null;
  onChange: (storyId: string | null) => void;
}) {
  const { data: stories = [] } = useStoriesQuery();
  const current = stories.find((s) => s.id === storyId);
  // The board's own link counts even if the story was since pointed at another scenario.
  const candidates = stories.filter((s) => s.scenarioId === scenarioId || s.id === storyId);
  if (candidates.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <Combobox
        label={t("board.storyLabel")}
        value={current?.id ?? ""}
        options={[{ value: "", label: t("board.noStory") }, ...candidates.map((s) => ({ value: s.id ?? "", label: s.title }))]}
        onChange={(id) => onChange(id || null)}
        style={{ width: "100%" }}
      />
      {current && (
        <details style={{ marginTop: 8, padding: "8px 10px", border: `1px solid ${colors.borderSoft}`, borderRadius: 8 }}>
          {/* Stays display: list-item; flex would drop the disclosure triangle. */}
          <summary style={{ cursor: "pointer", fontSize: font.size.small, fontWeight: 600, color: colors.textDim }}>
            <BrandIcon name="story" color={colors.accentBright} size={14} />{" "}
            {t("board.showStory")}
          </summary>
          <div style={{ marginTop: 8 }}>
            <CompetencyBadge competency={current.competency} />
            <StarSections story={current} />
          </div>
        </details>
      )}
    </div>
  );
}

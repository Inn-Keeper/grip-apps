import { colors, font, tints } from "@grip/core/tokens";
import { t } from "@grip/core/i18n";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Story } from "./types";

export type StoryMode = "stories" | "drill";

// Left rail = navigate (rule 4): your stories or the prompt drill. The main action lives in Next Up.
export function StoryLeftRail({ mode, setMode, stories }: { mode: StoryMode; setMode: (m: StoryMode) => void; stories: Story[] }) {
  const items: { id: StoryMode; icon: string; label: string }[] = [
    { id: "stories", icon: "story", label: t("stories.myStories") },
    { id: "drill", icon: "prompt", label: t("stories.drillPrompts") },
  ];
  return (
    <WorkspacePanel>
      <WorkspaceTitle
        icon={<BrandIcon name="story" color={colors.accentBright} size={17} />}
        title={t("stories.behavioralPrep")}
        subtitle={t("stories.count", { count: stories.length })}
      />
      <nav aria-label={t("stories.title")} style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
        {items.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setMode(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", border: "none", borderRadius: 7,
                background: active ? tints.accentSoft : "transparent", color: active ? colors.accentBright : colors.textDim,
                fontSize: font.size.body, fontWeight: 800, cursor: "pointer", textAlign: "left",
              }}
            >
              <BrandIcon name={item.icon} color={active ? colors.accentBright : colors.textFaint} size={14} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </WorkspacePanel>
  );
}

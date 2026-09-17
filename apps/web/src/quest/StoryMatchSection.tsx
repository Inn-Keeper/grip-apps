import { useState } from "react";
import { groupStoriesByCompetency } from "@grip-apps/core/stories";
import { colors } from "@grip-apps/core/tokens";
import { BrandIcon } from "../components/BrandIcon";

export type Story = { id?: string; title: string; competency: string };

export function StoryMatchSection({ stories }: { stories: Story[] }) {
  const [open, setOpen] = useState(false);
  const grouped = groupStoriesByCompetency(stories);
  const covered = grouped.filter((g) => g.stories.length > 0);
  const gaps = grouped.filter((g) => g.stories.length === 0);

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "4px 10px",
          background: "transparent",
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          color: colors.textDim,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <BrandIcon name="story" color={colors.textDim} size={12} />
        Prep stories ({covered.length}/{grouped.length} competencies)
        <BrandIcon name={open ? "arrowUp" : "arrowDown"} color={colors.textDim} size={11} />
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 12px",
            background: colors.well,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {covered.map((g) => (
            <div key={g.competency}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  background: `${g.color}20`,
                  borderRadius: 12,
                  color: g.color,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                {g.competency.toUpperCase()}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 4 }}>
                {g.stories.map((s) => (
                  <span key={s.id ?? s.title} style={{ fontSize: 12, color: colors.text }}>
                    · {s.title}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {gaps.length > 0 && (
            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {gaps.map((g) => (
                <span
                  key={g.competency}
                  style={{
                    padding: "2px 8px",
                    background: `${colors.textFaint}15`,
                    borderRadius: 12,
                    color: colors.textFaint,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {g.competency} · no story
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

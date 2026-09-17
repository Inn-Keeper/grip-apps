import { colors } from "@grip-apps/core/tokens";

// Small removable/toggleable tech chip row shared by the posting detector and
// the retro struggle tagger.
export function TechChips({
  label,
  techs,
  dimmed = [],
  onRemove,
  onToggle,
}: {
  label: string;
  techs: string[];
  dimmed?: string[];
  onRemove?: (tech: string) => void;
  onToggle?: (tech: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: colors.textFaint, letterSpacing: "0.06em", marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {techs.map((tech) => {
          const off = dimmed.includes(tech);
          return (
            <button
              key={tech}
              type="button"
              onClick={() => (onToggle ? onToggle(tech) : onRemove?.(tech))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 999,
                border: `1px solid ${off ? colors.border : `${colors.accent}60`}`,
                background: off ? "transparent" : `${colors.accent}1A`,
                color: off ? colors.textFaint : colors.accentBright,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: off ? "line-through" : "none",
              }}
            >
              {tech}
              {onRemove && <span aria-hidden="true">×</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

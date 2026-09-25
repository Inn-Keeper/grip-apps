import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@grip/core/tokens";
import { miniBtn } from "../components/fieldStyles";
import hover from "../components/HoverCard.module.css";
import { CompetencyBadge } from "./CompetencyBadge";
import { StoryLinks } from "./StoryLinks";
import type { Story } from "./types";
import { ErrorText } from "../components/ErrorText";

function StarSection({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div style={{ fontSize: font.size.caption, fontWeight: 700, color: colors.textFaint, letterSpacing: "0.08em", marginBottom: 2 }}>
        {label.toUpperCase()}
      </div>
      <p style={{ margin: 0, fontSize: font.size.body, lineHeight: 1.55, color: colors.text, whiteSpace: "pre-wrap" }}>{text}</p>
    </div>
  );
}

// The four STAR sections, used by the focused view and the drill's revealed stories.
export function StarSections({ story }: { story: Story }) {
  return (
    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <StarSection label={t("stories.situation")} text={story.situation} />
      <StarSection label={t("stories.task")} text={story.task} />
      <StarSection label={t("stories.action")} text={story.action} />
      <StarSection label={t("stories.result")} text={story.result} />
    </div>
  );
}

// A real basis (not flex: 1's 0) lets a long title drop to its own line on narrow
// cards instead of squeezing into a sliver beside the badge and buttons.
const titleStyle = { flex: "1 1 220px", minWidth: 0, overflowWrap: "anywhere", fontSize: font.size.bodyLg, fontWeight: 700, color: colors.textBright } as const;

// A fixed-size summary (rule 8). In the drill the STAR is shown in full, since that's what you came to read.
export function StoryCard({ story: s, onOpen, onEdit, onDelete, error, readOnly }: {
  story: Story;
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  error?: string | null;
  readOnly?: boolean;
}) {
  return (
    <div className={readOnly ? undefined : hover.hoverCard} style={{ background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: 14, boxShadow: shadow.card, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <CompetencyBadge competency={s.competency} />
        {onOpen ? (
          <button type="button" onClick={onOpen} style={{ ...titleStyle, padding: 0, background: "transparent", border: "none", textAlign: "left", cursor: "pointer" }}>
            {s.title}
          </button>
        ) : (
          <span style={titleStyle}>{s.title}</span>
        )}
        {(onOpen || !readOnly) && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {onOpen && <button type="button" onClick={onOpen} style={miniBtn(colors.accentBright ?? "")}>{t("stories.open")}</button>}
            {!readOnly && onEdit && <button type="button" onClick={onEdit} style={miniBtn(colors.textDim ?? "")}>{t("common.edit")}</button>}
            {!readOnly && onDelete && <button type="button" onClick={onDelete} style={miniBtn(colors.danger ?? "")}>{t("common.delete")}</button>}
          </div>
        )}
      </div>
      {readOnly && <StarSections story={s} />}
      {/* Errors land on the story they belong to (rule 13). */}
      {error && <ErrorText margin="10px 0 0">{error}</ErrorText>}
    </div>
  );
}

// One story in the focused view: the full STAR with its actions.
export function StoryDetail({ story, onEdit, onDelete, error }: { story: Story; onEdit: () => void; onDelete: () => void; error?: string | null }) {
  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: 14, boxShadow: shadow.card, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <CompetencyBadge competency={story.competency} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button type="button" onClick={onEdit} style={miniBtn(colors.textDim ?? "")}>{t("common.edit")}</button>
          <button type="button" onClick={onDelete} style={miniBtn(colors.danger ?? "")}>{t("common.delete")}</button>
        </div>
      </div>
      <h2 style={{ margin: "12px 0 0", fontSize: font.size.title, fontWeight: 800, color: colors.textBright }}>{story.title}</h2>
      <StarSections story={story} />
      <StoryLinks story={story} />
      {error && <ErrorText margin="12px 0 0">{error}</ErrorText>}
    </div>
  );
}

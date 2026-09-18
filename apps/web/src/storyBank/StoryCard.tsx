import React, { useState } from "react";
import { t } from "@grip/core/i18n";
import { colors, shadow } from "@grip/core/tokens";
import { CompetencyBadge } from "./CompetencyBadge";
import { miniBtn } from "../components/shared";
import type { Story } from "./types";
import hover from "../components/HoverCard.module.css";

function StarSection({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: colors.textFaint, letterSpacing: "0.08em", marginBottom: 2 }}>
        {label.toUpperCase()}
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: colors.text, whiteSpace: "pre-wrap" }}>{text}</p>
    </div>
  );
}

export function StoryCard({
  story: s,
  onEdit,
  onDelete,
  readOnly,
}: {
  story: Story;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={hover.hoverCard} style={{ background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: 14, boxShadow: shadow.card, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CompetencyBadge competency={s.competency} />
        <span
          onClick={() => setExpanded((v) => !v)}
          style={{ fontSize: 14, fontWeight: 600, color: colors.textBright, cursor: "pointer", flex: 1 }}
        >
          {s.title}
        </span>
        <button onClick={() => setExpanded((v) => !v)} style={miniBtn(colors.textDim ?? "")}>
          {expanded ? t("stories.collapse") : t("stories.expand")}
        </button>
        {!readOnly && <button onClick={onEdit} style={miniBtn(colors.textDim ?? "")}>{t("common.edit")}</button>}
        {!readOnly && <button onClick={onDelete} style={miniBtn(colors.danger ?? "")}>{t("common.delete")}</button>}
      </div>

      {expanded && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <StarSection label={t("stories.situation")} text={s.situation} />
          <StarSection label={t("stories.task")} text={s.task} />
          <StarSection label={t("stories.action")} text={s.action} />
          <StarSection label={t("stories.result")} text={s.result} />
        </div>
      )}
    </div>
  );
}

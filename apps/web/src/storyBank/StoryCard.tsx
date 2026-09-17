import React, { useState } from "react";
import { COMPETENCY_COLORS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { CompetencyBadge } from "./CompetencyBadge";
import { miniBtn } from "../components/shared";
import type { Story } from "./types";

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
  const color = COMPETENCY_COLORS[s.competency] || colors.textFaint;

  return (
    <div style={{ background: colors.surface, border: `1px solid ${color}30`, borderRadius: 14, padding: "16px 20px" }}>
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

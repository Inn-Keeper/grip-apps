import { useState } from "react";
import { STATUSES, STATUS_STYLES, isDue } from "@grip-apps/core/contacts";
import { t } from "@grip-apps/core/i18n";
import { colors, tints } from "@grip-apps/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { ActionButton } from "./shared";
import type { Contact, Retro, ScoredBoard } from "./types";
import { RetroForm, RetroLine } from "./RetroForm";
import { StoryMatchSection } from "./StoryMatchSection";
import type { Story } from "./StoryMatchSection";
import { PrepPlanSection } from "./PrepPlanSection";

type ContactCardProps = {
  contact: Contact;
  stories: Story[];
  answers: Record<string, { correct: number; wrong: number }>;
  boards: ScoredBoard[];
  retroOpen: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAdvance: () => void;
  onClearAction: () => void;
  onOpenRetro: () => void;
  onAddRetro: (retro: Omit<Retro, "id" | "date">) => void;
  onDeleteRetro: (retroId: string) => void;
};

export function ContactCard({
  contact: c,
  stories,
  answers,
  boards,
  retroOpen,
  onEdit,
  onDelete,
  onAdvance,
  onClearAction,
  onOpenRetro,
  onAddRetro,
  onDeleteRetro,
}: ContactCardProps) {
  const [showRetros, setShowRetros] = useState(false);
  const status = STATUS_STYLES[c.status] ?? STATUS_STYLES.Contacted ?? { color: "", bg: "" };
  const nextStatus = STATUSES[STATUSES.indexOf(c.status) + 1];
  const due = isDue(c);
  const retros = c.retros || [];

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${due ? `${colors.danger}80` : `${status.color}30`}`,
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "3px 10px",
            background: status.bg,
            borderRadius: 20,
            color: status.color,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {t(`enum.status.${c.status}` as Parameters<typeof t>[0]).toUpperCase()}
        </span>
        {c.date && <span style={{ fontSize: 11, color: colors.textFaint }}>{c.date}</span>}

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {nextStatus && (
            <ActionButton onClick={onAdvance} color={STATUS_STYLES[nextStatus]?.color ?? ""}>
              → {t(`enum.status.${nextStatus}` as Parameters<typeof t>[0])}
            </ActionButton>
          )}
          <ActionButton onClick={onOpenRetro} color={colors.accentBright}>
            {t("contacts.addRetro")}
          </ActionButton>
          <ActionButton onClick={onEdit} color={colors.textDim}>
            {t("common.edit")}
          </ActionButton>
          <ActionButton onClick={onDelete} color={colors.danger}>
            {t("common.delete")}
          </ActionButton>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: colors.textBright, marginBottom: 4 }}>{c.name}</div>

      {c.role && (
        <div style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
          {c.link ? (
            <a href={c.link} target="_blank" rel="noreferrer" style={{ color: colors.accentBright, textDecoration: "none" }}>
              {c.role} ↗
            </a>
          ) : (
            c.role
          )}
        </div>
      )}

      {c.note && <div style={{ fontSize: 12.5, color: colors.textDim }}>{c.note}</div>}

      {c.nextAction && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            background: due ? tints.dangerSoft : tints.warningSoft,
            border: `1px solid ${due ? `${colors.danger}60` : `${colors.warning}40`}`,
            borderRadius: 8,
            fontSize: 12.5,
            color: due ? colors.dangerBright : colors.warningBright,
          }}
        >
          <BrandIcon
            name={due ? "warning" : "calendar"}
            color={due ? colors.dangerBright : colors.warningBright}
            size={15}
          />
          <span style={{ flex: 1 }}>
            {due && <span style={{ fontWeight: 600 }}>{t("contacts.due")} · </span>}
            {c.nextAction}
            {c.nextActionDate && <span style={{ opacity: 0.7 }}> · {c.nextActionDate}</span>}
          </span>
          <button
            onClick={onClearAction}
            title={t("contacts.markDone")}
            style={{
              padding: "3px 10px",
              background: "transparent",
              border: `1px solid ${due ? `${colors.danger}60` : `${colors.warning}50`}`,
              borderRadius: 6,
              color: "inherit",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("contacts.doneShort")}
          </button>
        </div>
      )}

      {c.status === "Interviewing" && c.postingTechs.length > 0 && (
        <PrepPlanSection contact={c} answers={answers} stories={stories} boards={boards} />
      )}

      <StoryMatchSection stories={stories} />

      {retros.length > 0 && (
        <button
          onClick={() => setShowRetros((v) => !v)}
          style={{
            marginTop: 10,
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
          <BrandIcon name="retro" color={colors.textDim} size={12} />
          {t("contacts.retros", { count: retros.length })}
          <BrandIcon name={showRetros ? "arrowUp" : "arrowDown"} color={colors.textDim} size={11} />
        </button>
      )}

      {showRetros &&
        retros.map((r) => (
          <div
            key={r.id}
            style={{
              marginTop: 8,
              padding: "10px 12px",
              background: colors.well,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{r.round || t("retro.round")}</span>
              <span style={{ fontSize: 11, color: colors.textFaint }}>{r.date}</span>
              <button
                onClick={() => r.id && onDeleteRetro(r.id)}
                title={t("contacts.deleteRetro")}
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <BrandIcon name="close" color={colors.textFaint} size={11} />
              </button>
            </div>
            <RetroLine label={t("contacts.questionsAsked")} text={r.questions} />
            <RetroLine label={t("retro.wentWell")} text={r.wentWell} />
            <RetroLine label={t("retro.toImprove")} text={r.toImprove} />
            <RetroLine label={t("retro.struggled")} text={r.struggledTechs.join(", ")} />
          </div>
        ))}

      {retroOpen && <RetroForm onSave={onAddRetro} onCancel={onOpenRetro} />}
    </div>
  );
}

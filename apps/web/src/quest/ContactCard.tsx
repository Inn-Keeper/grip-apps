import type { ReactNode } from "react";
import { STATUSES, STATUS_STYLES, isDue } from "@grip/core/contacts";
import { t } from "@grip/core/i18n";
import { colors, font, tints, shadow } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import hover from "../components/HoverCard.module.css";
import { ActionButton } from "./shared";
import type { Contact } from "./types";

export type ContactActions = {
  onAdvance: () => void;
  onRetro: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClearAction: () => void;
};

// A fixed-size summary of one contact (rule 8): details, retros and forms open in the focused view.
export function ContactCard({ contact, error, onOpen, ...actions }: ContactActions & { contact: Contact; error?: string | null; onOpen: () => void }) {
  const retros = contact.retros?.length ?? 0;
  const hasPlan = contact.status === "Interviewing" && contact.postingTechs.length > 0;
  return (
    <ContactPanel due={isDue(contact)} className={hover.hoverCard}>
      <ContactSummary contact={contact} error={error} onOpen={onOpen} {...actions} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, fontSize: font.size.small, color: colors.textFaint }}>
        {hasPlan && <span>{t("quest.hasPrepPlan")}</span>}
        {retros > 0 && <span>{t("contacts.retros", { count: retros })}</span>}
        <button type="button" onClick={onOpen} style={linkButton}>
          {t("quest.open")} →
        </button>
      </div>
    </ContactPanel>
  );
}

// Header, actions, note and follow-up reminder: shared by the card and the focused view.
export function ContactSummary({ contact: c, error, onOpen, onAdvance, onRetro, onEdit, onDelete, onClearAction }: ContactActions & { contact: Contact; error?: string | null; onOpen?: () => void }) {
  const status = STATUS_STYLES[c.status] ?? STATUS_STYLES.Contacted ?? { color: "", bg: "" };
  const nextStatus = STATUSES[STATUSES.indexOf(c.status) + 1];
  const due = isDue(c);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ padding: "3px 10px", background: status.bg, borderRadius: 999, color: status.color, fontSize: font.size.label, fontWeight: 700, letterSpacing: "0.04em" }}>
          {t(`enum.status.${c.status}` as Parameters<typeof t>[0]).toUpperCase()}
        </span>
        {c.date && <span style={{ fontSize: font.size.label, color: colors.textFaint }}>{c.date}</span>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {nextStatus && (
            <ActionButton onClick={onAdvance} color={STATUS_STYLES[nextStatus]?.color ?? ""}>
              → {t(`enum.status.${nextStatus}` as Parameters<typeof t>[0])}
            </ActionButton>
          )}
          <ActionButton onClick={onRetro} color={colors.accentBright}>{t("contacts.addRetro")}</ActionButton>
          <ActionButton onClick={onEdit} color={colors.textDim}>{t("common.edit")}</ActionButton>
          <ActionButton onClick={onDelete} color={colors.danger}>{t("common.delete")}</ActionButton>
        </div>
      </div>

      {onOpen ? (
        <button type="button" onClick={onOpen} style={{ ...linkButton, display: "block", textDecoration: "none", color: colors.textBright, fontSize: font.size.bodyLg, fontWeight: 700, marginBottom: 4 }}>
          {c.name}
        </button>
      ) : (
        <h2 style={{ margin: "0 0 4px", fontSize: font.size.title, fontWeight: 800, color: colors.textBright }}>{c.name}</h2>
      )}

      {c.role && (
        <div style={{ fontSize: font.size.body, color: colors.text, marginBottom: 4 }}>
          {c.link ? (
            <a href={c.link} target="_blank" rel="noreferrer" style={{ color: colors.accentBright, textDecoration: "none" }}>{c.role} ↗</a>
          ) : (
            c.role
          )}
        </div>
      )}

      {c.note && <div style={{ fontSize: font.size.body, color: colors.textDim }}>{c.note}</div>}

      {c.nextAction && (
        // Informative box: the one place a light, coloured edge is allowed (rule 22).
        <div
          style={{
            marginTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
            background: due ? tints.dangerSoft : tints.warningSoft,
            border: `1px solid ${due ? `${colors.danger}60` : `${colors.warning}40`}`,
            borderRadius: 8, fontSize: font.size.body, color: due ? colors.dangerBright : colors.warningBright,
          }}
        >
          <BrandIcon name={due ? "warning" : "calendar"} color={due ? colors.dangerBright : colors.warningBright} size={15} />
          <span style={{ flex: 1 }}>
            {due && <span style={{ fontWeight: 600 }}>{t("contacts.due")} · </span>}
            {c.nextAction}
            {c.nextActionDate && <span style={{ opacity: 0.7 }}> · {c.nextActionDate}</span>}
          </span>
          <button
            type="button"
            onClick={onClearAction}
            title={t("contacts.markDone")}
            style={{
              padding: "3px 10px", background: "transparent", border: `1px solid ${due ? `${colors.danger}60` : `${colors.warning}50`}`,
              borderRadius: 6, color: "inherit", fontSize: font.size.label, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("contacts.doneShort")}
          </button>
        </div>
      )}

      {/* Errors land on the contact they belong to (rule 13). */}
      {error && <p role="alert" style={{ margin: "10px 0 0", fontSize: font.size.small, color: colors.dangerBright }}>{error}</p>}
    </>
  );
}

// The contact's card surface; a due follow-up is the one reason for a light edge (rule 22).
export function ContactPanel({ due, className, children }: { due: boolean; className?: string; children: ReactNode }) {
  return (
    <div
      className={className}
      style={{
        background: colors.surface,
        border: `1px solid ${due ? `${colors.danger}80` : colors.borderSoft}`,
        boxShadow: shadow.card,
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      {children}
    </div>
  );
}

const linkButton = {
  background: "transparent", border: "none", padding: 0, textAlign: "left" as const,
  color: colors.accentBright, fontSize: font.size.small, fontWeight: 600, cursor: "pointer", textDecoration: "underline",
};

import { isDue } from "@grip/core/contacts";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { ContactPanel, ContactSummary, type ContactActions } from "./ContactCard";
import { PrepPlanSection } from "./PrepPlanSection";
import { RetroLine } from "./RetroForm";
import { StoryMatchSection, type Story } from "./StoryMatchSection";
import type { Contact, ScoredBoard } from "./types";

// One contact in the focused view (rule 8): everything that used to expand inside the card.
export function ContactDetail({ contact, stories, answers, boards, error, onDeleteRetro, ...actions }: ContactActions & {
  contact: Contact;
  stories: Story[];
  answers: Record<string, { correct: number; wrong: number }>;
  boards: ScoredBoard[];
  error?: string | null;
  onDeleteRetro: (retroId: string) => void;
}) {
  const retros = contact.retros ?? [];
  return (
    <ContactPanel due={isDue(contact)}>
      <ContactSummary contact={contact} error={error} {...actions} />

      {contact.status === "Interviewing" && contact.postingTechs.length > 0 && (
        <PrepPlanSection contact={contact} answers={answers} stories={stories} boards={boards} />
      )}

      <StoryMatchSection stories={stories} />

      <h3 style={{ margin: "20px 0 8px", fontSize: font.size.body, fontWeight: 800, color: colors.textBright }}>{t("quest.retrosTitle")}</h3>
      {retros.length === 0 && <p style={{ margin: 0, fontSize: font.size.small, color: colors.textFaint }}>{t("quest.noRetros")}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {retros.map((r) => (
          <div key={r.id} style={{ padding: "10px 12px", background: colors.well, border: `1px solid ${colors.borderSoft}`, borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: font.size.small, fontWeight: 700, color: colors.text }}>{r.round || t("retro.round")}</span>
              <span style={{ fontSize: font.size.label, color: colors.textFaint }}>{r.date}</span>
              <button
                type="button"
                onClick={() => r.id && onDeleteRetro(r.id)}
                title={t("contacts.deleteRetro")}
                style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
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
      </div>
    </ContactPanel>
  );
}

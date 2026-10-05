import type { ReactNode } from "react";
import { buildAgenda } from "@grip/core/agenda";
import { parseDDMMYYYY } from "@grip/core/contacts";
import { getLocale, t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Contact } from "./types";

// The rest of a long section is one click away in the pipeline below.
const MAX_LINES = 5;
const oneLine = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

function Section({ label, items, render }: { label: string; items: Contact[]; render: (contact: Contact) => ReactNode }) {
  if (items.length === 0) return null;
  const hidden = items.length - MAX_LINES;
  return (
    <section>
      <h3 style={{ margin: "0 0 4px", color: colors.textFaint, fontSize: font.size.micro, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.slice(0, MAX_LINES).map((contact) => <li key={contact.id}>{render(contact)}</li>)}
      </ul>
      {hidden > 0 && <p style={{ margin: "4px 0 0", color: colors.textFaint, fontSize: font.size.label }}>{t("quest.agendaMore", { count: hidden })}</p>}
    </section>
  );
}

function Line({ contact, onOpen, lead, detail, extra }: { contact: Contact; onOpen: (id: string) => void; lead?: string; detail: ReactNode; extra?: ReactNode }) {
  const title = [contact.name, contact.role].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={() => contact.id && onOpen(contact.id)}
      style={{ width: "100%", padding: "6px 8px", border: "none", borderRadius: 7, background: "transparent", cursor: "pointer", textAlign: "left", fontSize: font.size.small }}
    >
      <span style={{ display: "flex", gap: 6, color: colors.text, fontWeight: 700 }}>
        {lead && <span style={{ color: colors.textDim }}>{lead}</span>}
        <span style={oneLine}>{title}</span>
      </span>
      <span style={{ display: "block", marginTop: 2, color: colors.textDim, ...oneLine }}>{detail}</span>
      {extra}
    </button>
  );
}

// Quest left rail, top: today's follow-ups, what slipped, interviews to prep and the week ahead.
export function QuestAgenda({ contacts, error, onOpen }: {
  contacts: Contact[] | null;
  error: Error | null;
  onOpen: (id: string) => void;
}) {
  const weekday = new Intl.DateTimeFormat(getLocale(), { weekday: "short" });
  const action = (contact: Contact) => contact.nextAction || t("quest.agendaNoAction");
  const agenda = contacts ? buildAgenda(contacts, new Date()) : null;

  return (
    <WorkspacePanel>
      <WorkspaceTitle icon={<BrandIcon name="calendar" color={colors.accentBright} size={17} />} title={t("quest.agendaTitle")} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {error && <p style={{ margin: 0, color: colors.dangerBright, fontSize: font.size.small }}>{t("quest.agendaError")}</p>}
        {!error && !agenda && <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.small }}>{t("quest.agendaLoading")}</p>}
        {!error && agenda?.isEmpty && <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.small, lineHeight: 1.5 }}>{t("quest.agendaEmpty")}</p>}
        {!error && agenda && (
          <>
            <Section label={t("quest.agendaToday")} items={agenda.today} render={(c) => <Line contact={c} onOpen={onOpen} detail={action(c)} />} />
            <Section
              label={t("quest.agendaOverdue")}
              items={agenda.overdue}
              render={(c) => (
                <Line
                  contact={c}
                  onOpen={onOpen}
                  detail={<><span style={{ color: colors.warning }}>{t("quest.agendaDaysLate", { days: (c as Contact & { daysLate: number }).daysLate })}</span> · {action(c)}</>}
                />
              )}
            />
            <Section
              label={t("quest.agendaPrep")}
              items={agenda.prep}
              render={(c) => {
                const { techs, lastToImprove } = c as Contact & { techs: string[]; lastToImprove: string | null };
                return (
                  <Line
                    contact={c}
                    onOpen={onOpen}
                    detail={techs.join(", ")}
                    extra={lastToImprove && <span style={{ display: "block", marginTop: 2, color: colors.textFaint, ...oneLine }}>{t("quest.agendaLastRetro", { note: lastToImprove })}</span>}
                  />
                );
              }}
            />
            <Section
              label={t("quest.agendaWeek")}
              items={agenda.week}
              render={(c) => <Line contact={c} onOpen={onOpen} lead={weekday.format(parseDDMMYYYY(c.nextActionDate) ?? new Date())} detail={action(c)} />}
            />
          </>
        )}
      </div>
    </WorkspacePanel>
  );
}

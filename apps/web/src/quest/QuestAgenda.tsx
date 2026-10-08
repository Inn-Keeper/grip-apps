import type { CSSProperties, ReactNode } from "react";
import { buildAgenda } from "@grip/core/agenda";
import { parseDDMMYYYY } from "@grip/core/contacts";
import { getLocale, t } from "@grip/core/i18n";
import { colors, font, radius, space } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import type { Contact } from "./types";
import styles from "./QuestAgenda.module.css";

// The rest of a long section is one click away in the pipeline below.
const MAX_LINES = 5;
const oneLine = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const;

// Header mirrors the pipeline filter rows: tone dot, label, count.
function Section({ label, tone, items, render }: { label: string; tone: string; items: Contact[]; render: (contact: Contact) => ReactNode }) {
  if (items.length === 0) return null;
  const hidden = items.length - MAX_LINES;
  return (
    <section>
      <h3 style={{
          display: "flex",
          alignItems: "center",
          gap: space.sm,
          margin: `0 0 ${space.sm}px`,
          padding: `0 ${space.sm}px`,
          fontSize: font.size.caption,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase"
        }}>
        <span style={{
            width: 6,
            height: 6,
            borderRadius: radius.pill,
            background: tone
          }} />
        <span style={{
            flex: 1,
            color: colors.textDim
          }}>{label}</span>
        <span style={{
            color: tone,
            fontVariantNumeric: "tabular-nums"
          }}>{items.length}</span>
      </h3>
      <ul style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}>
        {items.slice(0, MAX_LINES).map((contact) => <li key={contact.id}>{render(contact)}</li>)}
      </ul>
      {hidden > 0 && <p style={{
          margin: `${space.sm}px 0 0`,
          padding: `0 ${space.sm}px`,
          color: colors.textFaint,
          fontSize: font.size.label
        }}>{t("quest.agendaMore", { count: hidden })}</p>}
    </section>
  );
}

// Date on the left, the contact in the middle, the posting link on the right.
function Line({ contact, tone, onOpen, detail, extra }: { contact: Contact; tone: string; onOpen: (id: string) => void; detail: ReactNode; extra?: ReactNode }) {
  const title = [contact.name, contact.role].filter(Boolean).join(" · ");
  const date = parseDDMMYYYY(contact.nextActionDate);
  return (
    <div
      className={styles.line}
      style={{
        "--agenda-hover": colors.surfaceHi,
        "--agenda-tone": tone,
        display: "flex",
        alignItems: "stretch",
        borderLeft: `2px solid ${tone}60`,
        borderRadius: radius.sm,
        background: colors.well,
      } as CSSProperties}
    >
      <span style={{
          width: 46,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: tone,
          lineHeight: 1.1
        }}>
        {date ? (
          <>
            <span style={{
                fontSize: font.size.caption,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.4
              }}>{weekdayFormat().format(date)}</span>
            <span style={{
                fontSize: font.size.bodyLg,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums"
              }}>{date.getDate()}</span>
          </>
        ) : (
          <span style={{ color: colors.textFaint }}>—</span>
        )}
      </span>
      <button
        type="button"
        onClick={() => contact.id && onOpen(contact.id)}
        style={{
          flex: 1,
          minWidth: 0,
          padding: `${space.md}px ${space.md}px ${space.md}px ${space.xs}px`,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontSize: font.size.small
        }}
      >
        <span style={{
            display: "block",
            color: colors.text,
            fontSize: font.size.body,
            fontWeight: 700,
            ...oneLine
          }}>{title}</span>
        <span style={{
            display: "block",
            marginTop: 2,
            color: colors.textDim,
            ...oneLine
          }}>{detail}</span>
        {extra}
      </button>
      {contact.link && (
        <a
          href={contact.link}
          target="_blank"
          rel="noreferrer"
          aria-label={t("quest.agendaOpenLink", { name: contact.name })}
          style={{
            display: "flex",
            alignItems: "center",
            padding: `0 ${space.md}px`,
            color: colors.accentBright,
            textDecoration: "none",
            fontWeight: 800
          }}
        >
          ↗
        </a>
      )}
    </div>
  );
}

const weekdayFormat = () => new Intl.DateTimeFormat(getLocale(), { weekday: "short" });

// Quest left rail, top: today's follow-ups, what slipped, interviews to prep and the week ahead.
export function QuestAgenda({ contacts, error, onOpen }: {
  contacts: Contact[] | null;
  error: Error | null;
  onOpen: (id: string) => void;
}) {
  const tones = { today: colors.accentBright ?? "", overdue: colors.warningBright ?? "", prep: colors.successBright ?? "", week: colors.textDim ?? "" };
  const action = (contact: Contact) => contact.nextAction || t("quest.agendaNoAction");
  const agenda = contacts ? buildAgenda(contacts, new Date()) : null;

  return (
    <WorkspacePanel>
      <WorkspaceTitle icon={<BrandIcon name="calendar" color={colors.accentBright} size={17} />} title={t("quest.agendaTitle")} />
      <div style={{
          display: "flex",
          flexDirection: "column",
          gap: space.xl,
          marginTop: space.lg
        }}>
        {error && <p style={{
            margin: 0,
            color: colors.dangerBright,
            fontSize: font.size.small
          }}>{t("quest.agendaError")}</p>}
        {!error && !agenda && <p style={{
            margin: 0,
            color: colors.textFaint,
            fontSize: font.size.small
          }}>{t("quest.agendaLoading")}</p>}
        {!error && agenda?.isEmpty && <p style={{
            margin: 0,
            color: colors.textFaint,
            fontSize: font.size.small,
            lineHeight: 1.5
          }}>{t("quest.agendaEmpty")}</p>}
        {!error && agenda && (
          <>
            <Section label={t("quest.agendaToday")} tone={tones.today} items={agenda.today} render={(c) => <Line contact={c} tone={tones.today} onOpen={onOpen} detail={action(c)} />} />
            <Section
              label={t("quest.agendaOverdue")}
              tone={tones.overdue}
              items={agenda.overdue}
              render={(c) => (
                <Line
                  contact={c}
                  tone={tones.overdue}
                  onOpen={onOpen}
                  detail={<><span style={{
                      color: colors.warningBright,
                      fontWeight: 700
                    }}>{t("quest.agendaDaysLate", { days: (c as Contact & { daysLate: number }).daysLate })}</span> · {action(c)}</>}
                />
              )}
            />
            <Section
              label={t("quest.agendaPrep")}
              tone={tones.prep}
              items={agenda.prep}
              render={(c) => {
                const { techs, lastToImprove } = c as Contact & { techs: string[]; lastToImprove: string | null };
                return (
                  <Line
                    contact={c}
                    tone={tones.prep}
                    onOpen={onOpen}
                    detail={techs.join(", ")}
                    extra={lastToImprove && <span style={{
                        display: "block",
                        marginTop: 2,
                        color: colors.textFaint,
                        ...oneLine
                      }}>{t("quest.agendaLastRetro", { note: lastToImprove })}</span>}
                  />
                );
              }}
            />
            <Section
              label={t("quest.agendaWeek")}
              tone={tones.week}
              items={agenda.week}
              render={(c) => <Line contact={c} tone={tones.week} onOpen={onOpen} detail={action(c)} />}
            />
          </>
        )}
      </div>
    </WorkspacePanel>
  );
}

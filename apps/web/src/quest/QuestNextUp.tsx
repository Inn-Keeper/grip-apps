import { isDue } from "@grip/core/contacts";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { NextUpLink, NextUpShell } from "../components/NextUpShell";
import type { Contact } from "./types";

// Quest's one main action (rule 1). Priority: a due follow-up (time-sensitive) → an
// interview with a prep plan → adding the next contact.
export function QuestNextUp({ contacts, onOpen, onAdd }: { contacts: Contact[]; onOpen: (id: string) => void; onAdd: () => void }) {
  const due = contacts.find(isDue);
  const interview = contacts.find((c) => c.status === "Interviewing" && c.postingTechs.length > 0);
  const addLink = <NextUpLink label={t("quest.addContactLink")} onClick={onAdd} />;

  if (due?.id) {
    const id = due.id;
    return (
      <NextUpShell
        title={t("quest.nextDueTitle", { name: due.name })}
        sub={[due.nextAction, due.nextActionDate].filter(Boolean).join(" · ")}
        tone={colors.warning ?? ""}
        actionLabel={t("quest.open")}
        actionIcon="calendar"
        onAction={() => onOpen(id)}
        links={addLink}
      />
    );
  }
  if (interview?.id) {
    const id = interview.id;
    return (
      <NextUpShell
        title={t("quest.nextInterviewTitle", { name: interview.name })}
        sub={t("quest.nextInterviewSub", { role: interview.role || "—" })}
        tone={colors.accent ?? ""}
        actionLabel={t("quest.openPrep")}
        onAction={() => onOpen(id)}
        links={addLink}
      />
    );
  }
  return (
    <NextUpShell
      title={t("quest.nextAddTitle")}
      sub={t("quest.nextAddSub")}
      tone={colors.accent ?? ""}
      actionLabel={t("contacts.addContactPlain")}
      actionIcon="contact"
      onAction={onAdd}
    />
  );
}

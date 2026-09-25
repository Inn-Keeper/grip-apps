import { useEffect, useState } from "react";
import { STATUSES, todayDDMMYYYY, isDue } from "@grip/core/contacts";
import { SCENARIOS, evaluate } from "@grip/core/arch";
import { buildFunnelSummary } from "@grip/core/funnel";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { WorkspaceLayout } from "../components/WorkspaceLayout";
import { workspaceFocusStyle } from "../components/fieldStyles";
import { ContactCard } from "./ContactCard";
import { ContactDetail } from "./ContactDetail";
import { ContactForm } from "./ContactForm";
import { QuestLeftRail } from "./QuestLeftRail";
import { QuestNextUp } from "./QuestNextUp";
import { QuestRightRail } from "./QuestRightRail";
import { RetroForm } from "./RetroForm";
import { EMPTY_FORM } from "./types";
import {
  useAddRetroMutation,
  useBoardsQuery,
  useContactStoriesQuery,
  useContactsQuery,
  useDeleteContactMutation,
  useDeleteRetroMutation,
  pipelineConfigured,
  usePipelineVelocityQuery,
  useSaveContactMutation,
  useScoresQuery,
  useStatusEventsQuery,
} from "./queries";
import type { Contact, Retro, ScoredBoard } from "./types";
import { scrollBehavior } from "../lib/motion";
import { ErrorBanner, ErrorText } from "../components/ErrorText";

// The focused view (rule 8): a contact's detail, a form, or a retro, in place of the list.
type Focus = { mode: "detail" | "edit" | "retro"; id: string } | { mode: "new" } | null;

export default function Quest() {
  const [focus, setFocus] = useState<Focus>(null);
  const [filter, setFilter] = useState<string | null>(null);
  // Confirmation after a change (rule 14); the contact a failed save belongs to (rule 13).
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const [touched, setTouched] = useState<string | null>(null);

  const { data: contacts = null, error: loadError } = useContactsQuery();
  const { data: stories = [] } = useContactStoriesQuery();
  const { data: statusEvents = [] } = useStatusEventsQuery();
  const { data: velocity, error: velocityError, isFetching: velocityLoading } = usePipelineVelocityQuery();
  const { data: scores } = useScoresQuery();
  const { data: boards = [] } = useBoardsQuery();
  const funnel = buildFunnelSummary(contacts ?? [], statusEvents);

  // Saved boards re-scored against their scenarios feed the readiness meter.
  // The deterministic topology score remains visible for every board. Design
  // readiness is computed only when a separate reasoning assessment exists.
  // ponytail: default scenarios only — custom-scenario boards are skipped.
  const scoredBoards = boards
    .map((board) => {
      const scenario = SCENARIOS.find((s: { id: string }) => s.id === board.scenarioId);
      if (!scenario) return null;
      return { topology: evaluate(scenario, board.nodes, board.edges).score, talkGrade: board.talkGrade ?? null };
    })
    .filter((entry): entry is ScoredBoard => entry !== null);

  const saveMutation = useSaveContactMutation();
  const deleteMutation = useDeleteContactMutation();
  const retroAddMutation = useAddRetroMutation();
  const retroDeleteMutation = useDeleteRetroMutation();
  const mutationError = saveMutation.error || deleteMutation.error || retroAddMutation.error || retroDeleteMutation.error;
  const errorFor = (id: string | undefined) =>
    mutationError && touched === id ? t("quest.saveError", { message: mutationError.message }) : null;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Opening or leaving a focused view starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }, [focus]);

  const announce = (text: string) => setNotice({ id: Date.now(), text });

  const handleSave = (form: Omit<Contact, "id" | "retros">) => {
    if (!form.name.trim()) return;
    const id = focus?.mode === "edit" ? focus.id : undefined;
    setTouched(id ?? "new");
    saveMutation.mutate(
      { ...form, id, date: form.date || todayDDMMYYYY() },
      { onSuccess: () => announce(t("quest.saved", { name: form.name })) }
    );
    setFocus(id ? { mode: "detail", id } : null);
  };

  const handleDelete = (contact: Contact) => {
    if (!window.confirm(t("contacts.deleteMessage", { name: contact.name }))) return;
    setTouched(contact.id ?? null);
    deleteMutation.mutate(contact.id, { onSuccess: () => announce(t("quest.deleted", { name: contact.name })) });
    setFocus(null);
  };

  const handleAdvance = (contact: Contact) => {
    const next = STATUSES[STATUSES.indexOf(contact.status) + 1];
    if (!next) return;
    setTouched(contact.id ?? null);
    saveMutation.mutate(
      { ...contact, status: next, date: todayDDMMYYYY() },
      { onSuccess: () => announce(t("quest.movedTo", { name: contact.name, status: t(`enum.status.${next}` as Parameters<typeof t>[0]) })) }
    );
  };

  const handleClearAction = (contact: Contact) => {
    setTouched(contact.id ?? null);
    saveMutation.mutate(
      { ...contact, nextAction: "", nextActionDate: "" },
      { onSuccess: () => announce(t("quest.actionDone", { name: contact.name })) }
    );
  };

  const handleAddRetro = (contact: Contact, retro: Omit<Retro, "id" | "date">) => {
    if (!contact.id) return;
    setTouched(contact.id);
    retroAddMutation.mutate(
      { contactId: contact.id, retro },
      { onSuccess: () => announce(t("quest.retroSaved", { name: contact.name })) }
    );
    setFocus({ mode: "detail", id: contact.id });
  };

  const handleDeleteRetro = (contact: Contact, retroId: string) => {
    setTouched(contact.id ?? null);
    retroDeleteMutation.mutate(retroId);
  };

  const actionsFor = (contact: Contact) => ({
    onAdvance: () => handleAdvance(contact),
    onRetro: () => contact.id && setFocus({ mode: "retro", id: contact.id }),
    onEdit: () => contact.id && setFocus({ mode: "edit", id: contact.id }),
    onDelete: () => handleDelete(contact),
    onClearAction: () => handleClearAction(contact),
  });

  // Due follow-ups first, then the stage filter from the left rail.
  const sorted = contacts ? [...contacts].sort((a, b) => (isDue(b) ? 1 : 0) - (isDue(a) ? 1 : 0)) : null;
  const visible = sorted?.filter((c) => !filter || c.status === filter) ?? null;
  const focused = focus && focus.mode !== "new" ? contacts?.find((c) => c.id === focus.id) ?? null : null;

  const noticeLine = notice && (
    <p key={notice.id} role="status" style={{ margin: "0 0 16px", color: colors.accentBright, fontSize: font.size.body, fontWeight: 700 }}>
      {notice.text}
    </p>
  );

  return (
    <WorkspaceLayout
      mainLabel={t("quest.title")}
      lockedHint={focus ? t("quest.lockedHint") : null}
      left={<QuestLeftRail contacts={contacts ?? []} filter={filter} onFilter={setFilter} />}
      right={<QuestRightRail funnel={funnel} velocity={velocity} velocityError={velocityError} velocityLoading={velocityLoading} velocityEnabled={pipelineConfigured} statusEvents={statusEvents} />}
    >
      {loadError && (
        <ErrorBanner>
          {t("contacts.loadError", { message: loadError.message })}
        </ErrorBanner>
      )}

      {focus ? (
        <div style={workspaceFocusStyle}>
          <button
            type="button"
            onClick={() => setFocus(null)}
            style={{ marginBottom: 14, padding: 0, background: "transparent", border: "none", color: colors.accentBright, fontSize: font.size.body, fontWeight: 700, cursor: "pointer" }}
          >
            {t("quest.back")}
          </button>
          {noticeLine}
          {focus.mode === "new" && (
            <>
              <ContactForm initial={{ ...EMPTY_FORM, date: todayDDMMYYYY() }} onSave={handleSave} onCancel={() => setFocus(null)} />
              {errorFor("new") && <ErrorText>{errorFor("new")}</ErrorText>}
            </>
          )}
          {focused && focus.mode === "edit" && (
            <ContactForm initial={focused} onSave={handleSave} onCancel={() => setFocus({ mode: "detail", id: focus.id })} />
          )}
          {focused && focus.mode === "retro" && (
            <RetroForm onSave={(retro) => handleAddRetro(focused, retro)} onCancel={() => setFocus({ mode: "detail", id: focus.id })} />
          )}
          {focused && focus.mode === "detail" && (
            <ContactDetail
              contact={focused}
              stories={stories}
              answers={scores?.answers ?? {}}
              boards={scoredBoards}
              error={errorFor(focused.id)}
              onDeleteRetro={(retroId) => handleDeleteRetro(focused, retroId)}
              {...actionsFor(focused)}
            />
          )}
        </div>
      ) : (
        <>
          {contacts && <QuestNextUp contacts={contacts} onOpen={(id) => setFocus({ mode: "detail", id })} onAdd={() => setFocus({ mode: "new" })} />}

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: font.size.heading, fontWeight: 800, color: colors.textBright }}>
              {filter ? t(`enum.status.${filter}` as Parameters<typeof t>[0]) : t("quest.title")}
            </h1>
            <span style={{ marginLeft: "auto", fontSize: font.size.small, color: colors.textFaint, fontWeight: 600 }}>
              {visible ? t("quest.inPipeline", { count: visible.length }) : t("common.loading")}
            </span>
          </div>
          {/* The pipeline speaks for itself; this slot only carries save/delete notices. */}
          {noticeLine}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible?.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                error={errorFor(contact.id)}
                onOpen={() => contact.id && setFocus({ mode: "detail", id: contact.id })}
                {...actionsFor(contact)}
              />
            ))}
          </div>
        </>
      )}
    </WorkspaceLayout>
  );
}

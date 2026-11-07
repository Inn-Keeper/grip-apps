import React, { useState } from "react";
import { ROLE_POSITIONS, STATUSES, STATUS_STYLES } from "@grip/core/contacts";
import { extractTechsFromText } from "@grip/core/techMatch";
import { findDuplicate } from "@grip/core/duplicates";
import { PREP_TECHS } from "@grip/core/prepData";
import { t } from "@grip/core/i18n";
import { colors, shadow, font } from "@grip/core/tokens";
import { Combobox } from "../components/Combobox";
import { DateInput, Field } from "./shared";
import { fieldStyle as inputStyle, textareaFieldStyle as textareaStyle } from "../components/fieldStyles";
import { TechPicker } from "./TechPicker";
import { FormActions } from "../components/FormActions";
import { mayLeave, useUnsavedGuard } from "../lib/useUnsavedGuard";
import type { Contact } from "./types";
import { EMPTY_FORM } from "./types";

const POSTING_TECH_LIMIT = 12;

export function ContactForm({
  initial,
  contacts,
  saving,
  error,
  onSave,
  onCancel,
}: {
  initial: Partial<Contact>;
  contacts: Contact[];
  saving: boolean;
  error: string | null;
  onSave: (form: Omit<Contact, "id" | "retros">) => void;
  onCancel: () => void;
}) {
  const [start] = useState<Omit<Contact, "id" | "retros">>({ ...EMPTY_FORM, ...initial });
  const [form, setForm] = useState(start);
  // The pasted posting is parsed locally and never stored — only detected techs persist.
  const [posting, setPosting] = useState("");
  // Warns, never blocks: a second application to the same company can be real.
  const duplicate = findDuplicate({ ...form, id: initial.id }, contacts);
  useUnsavedGuard(!!posting.trim() || JSON.stringify(form) !== JSON.stringify(start));
  const set = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handlePosting = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setPosting(text);
    if (!text.trim()) return; // keep saved chips when the paste box is cleared
    const detected = extractTechsFromText(text, PREP_TECHS, POSTING_TECH_LIMIT);
    setForm((current) => ({ ...current, postingTechs: detected.map((d: { tech: string }) => d.tech) }));
  };

  // A fieldset freezes the submitted values until the save settles.
  return (
    <fieldset
      disabled={saving}
      style={{
        margin: 0,
        minWidth: 0,
        background: colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        boxShadow: shadow.card,
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10
        }}>
        <Field label={t("contacts.fieldName")}>
          <input style={inputStyle} value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Combobox
          label={t("contacts.fieldStatus")}
          value={form.status}
          options={STATUSES.map((status) => ({
            value: status,
            label: t(`enum.status.${status}` as Parameters<typeof t>[0]),
            color: STATUS_STYLES[status]?.color ?? "",
          }))}
          onChange={(status) => setForm((current) => ({ ...current, status }))}
        />
      </div>
      {duplicate && (
        <p role="status" style={{
            margin: 0,
            fontSize: font.size.label,
            color: colors.warningBright
          }}>
          {t(duplicate.kind === "duplicate" ? "contacts.duplicateWarn" : "contacts.possibleDuplicateWarn", { name: duplicate.contact.name })}
        </p>
      )}
      <Combobox
        label={t("contacts.fieldRole")}
        searchable
        value={form.role}
        onChange={(role) => setForm((current) => ({ ...current, role }))}
        placeholder={t("contacts.fieldRolePlaceholder")}
        options={ROLE_POSITIONS.map((role) => ({ value: role, label: role }))}
      />
      <Field label={t("contacts.fieldLink")}>
        <input style={inputStyle} value={form.link} onChange={set("link")} placeholder="https://..." />
      </Field>
      <Field label={t("contacts.fieldPosting")}>
        <textarea
          style={textareaStyle}
          value={posting}
          onChange={handlePosting}
          placeholder={t("contacts.postingPlaceholder")}
        />
      </Field>
      <TechPicker
        label={t("contacts.postingDetected")}
        techs={form.postingTechs}
        limit={POSTING_TECH_LIMIT}
        onChange={(postingTechs) => setForm((current) => ({ ...current, postingTechs }))}
      />
      <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 10
        }}>
        <Field label={t("contacts.fieldNote")}>
          <input style={inputStyle} value={form.note} onChange={set("note")} />
        </Field>
        <Field label={t("contacts.fieldDate")}>
          <DateInput value={form.date} onChange={(date) => setForm((current) => ({ ...current, date }))} />
        </Field>
      </div>
      <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 10
        }}>
        <Field label={t("contacts.fieldNextAction")}>
          <input
            style={inputStyle}
            value={form.nextAction}
            onChange={set("nextAction")}
            placeholder={t("contacts.fieldNextActionPlaceholder")}
          />
        </Field>
        <Field label={t("contacts.fieldDue")}>
          <DateInput
            value={form.nextActionDate}
            onChange={(nextActionDate) => setForm((current) => ({ ...current, nextActionDate }))}
          />
        </Field>
      </div>

      <FormActions canSave={!!form.name.trim()} saving={saving} error={error} onSave={() => onSave(form)} onCancel={() => mayLeave() && onCancel()} />
    </fieldset>
  );
}

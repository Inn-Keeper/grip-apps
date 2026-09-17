import React, { useState } from "react";
import { ROLE_POSITIONS, STATUSES, STATUS_STYLES } from "@grip-apps/core/contacts";
import { extractTechsFromText } from "@grip-apps/core/cvTechs";
import { categories } from "@grip-apps/core/prepData";
import { t } from "@grip-apps/core/i18n";
import { colors } from "@grip-apps/core/tokens";
import { Combobox } from "../components/Combobox";
import { DateInput, Field } from "./shared";
import { inputStyle, textareaStyle } from "../components/shared";
import { TechChips } from "./TechChips";
import type { Contact } from "./types";
import { EMPTY_FORM } from "./types";

const ALL_TECHS: string[] = categories.flatMap((c: { items: { tech: string }[] }) =>
  c.items.map((item) => item.tech)
);
const POSTING_TECH_LIMIT = 12;

export function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Contact>;
  onSave: (form: Omit<Contact, "id" | "retros">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Contact, "id" | "retros">>({ ...EMPTY_FORM, ...initial });
  // The pasted posting is parsed locally and never stored — only detected techs persist.
  const [posting, setPosting] = useState("");
  const set = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handlePosting = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setPosting(text);
    if (!text.trim()) return; // keep saved chips when the paste box is cleared
    const detected = extractTechsFromText(text, ALL_TECHS, POSTING_TECH_LIMIT);
    setForm((current) => ({ ...current, postingTechs: detected.map((d: { tech: string }) => d.tech) }));
  };

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.accent}60`,
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
      {form.postingTechs.length > 0 && (
        <TechChips
          label={t("contacts.postingDetected")}
          techs={form.postingTechs}
          onRemove={(tech) =>
            setForm((current) => ({
              ...current,
              postingTechs: current.postingTechs.filter((item) => item !== tech),
            }))
          }
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <Field label={t("contacts.fieldNote")}>
          <input style={inputStyle} value={form.note} onChange={set("note")} />
        </Field>
        <Field label={t("contacts.fieldDate")}>
          <DateInput value={form.date} onChange={(date) => setForm((current) => ({ ...current, date }))} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
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

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            color: colors.textDim,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.name.trim()}
          style={{
            padding: "8px 16px",
            background: colors.accent,
            border: "none",
            borderRadius: 8,
            color: colors.onAccent,
            fontSize: 13,
            fontWeight: 600,
            cursor: form.name.trim() ? "pointer" : "not-allowed",
            opacity: form.name.trim() ? 1 : 0.5,
          }}
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}

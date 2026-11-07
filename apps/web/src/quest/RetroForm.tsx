import React, { useState } from "react";
import { extractTechsFromText } from "@grip/core/techMatch";
import { categories } from "@grip/core/prepData";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { Field } from "../components/shared";
import { fieldStyle as inputStyle, textareaFieldStyle as textareaStyle } from "../components/fieldStyles";
import { TechChips } from "./TechChips";
import { FormActions } from "../components/FormActions";
import { mayLeave, useUnsavedGuard } from "../lib/useUnsavedGuard";
import type { Retro } from "./types";
import { EMPTY_RETRO } from "./types";

const ALL_TECHS: string[] = categories.flatMap((c: { items: { tech: string }[] }) =>
  c.items.map((item) => item.tech)
);

export function RetroLine({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{
          fontSize: font.size.caption,
          fontWeight: 700,
          color: colors.textFaint,
          letterSpacing: "0.06em"
        }}>
        {label.toUpperCase()}:{" "}
      </span>
      <span style={{
          fontSize: font.size.body,
          color: colors.textDim,
          whiteSpace: "pre-wrap"
        }}>{text}</span>
    </div>
  );
}

export function RetroForm({
  saving,
  error,
  onSave,
  onCancel,
}: {
  saving: boolean;
  error: string | null;
  onSave: (retro: Omit<Retro, "id" | "date">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Retro, "id" | "date">>(EMPTY_RETRO);
  useUnsavedGuard(JSON.stringify(form) !== JSON.stringify(EMPTY_RETRO));
  // Techs manually toggled off — struggles are detected from the retro text,
  // and everything detected counts unless the user opts a tech out.
  const [excluded, setExcluded] = useState<string[]>([]);
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const detected = extractTechsFromText(`${form.questions}\n${form.toImprove}`, ALL_TECHS).map(
    (d: { tech: string }) => d.tech
  );
  const struggledTechs = detected.filter((tech) => !excluded.includes(tech));
  const toggleTech = (tech: string) =>
    setExcluded((current) =>
      current.includes(tech) ? current.filter((item) => item !== tech) : [...current, tech]
    );

  // A fieldset freezes the submitted values until the save settles.
  return (
    <fieldset
      disabled={saving}
      style={{
        margin: 0,
        minWidth: 0,
        marginTop: 10,
        padding: "12px 14px",
        background: colors.well,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <Field label={t("retro.round")}>
        <input
          style={inputStyle}
          value={form.round}
          onChange={set("round")}
          placeholder={t("retro.roundPlaceholder")}
          autoFocus
        />
      </Field>
      <Field label={t("retro.questions")}>
        <textarea style={textareaStyle} value={form.questions} onChange={set("questions")} />
      </Field>
      <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8
        }}>
        <Field label={t("retro.wentWell")}>
          <textarea style={textareaStyle} value={form.wentWell} onChange={set("wentWell")} />
        </Field>
        <Field label={t("retro.toImprove")}>
          <textarea style={textareaStyle} value={form.toImprove} onChange={set("toImprove")} />
        </Field>
      </div>
      {detected.length > 0 && (
        <div>
          <TechChips label={t("retro.struggled")} techs={detected} dimmed={excluded} onToggle={toggleTech} />
          <p style={{
              margin: "6px 0 0",
              fontSize: font.size.label,
              color: colors.textFaint
            }}>{t("retro.struggledHint")}</p>
        </div>
      )}
      <FormActions compact canSave saveLabel={t("contacts.saveRetro")} saving={saving} error={error} onSave={() => onSave({ ...form, struggledTechs })} onCancel={() => mayLeave() && onCancel()} />
    </fieldset>
  );
}

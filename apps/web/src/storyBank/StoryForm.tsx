import React, { useState } from "react";
import { COMPETENCIES, COMPETENCY_COLORS } from "@grip/core/stories";
import { t } from "@grip/core/i18n";
import { colors, shadow, font } from "@grip/core/tokens";
import { Combobox } from "../components/Combobox";
import { ScenarioForm } from "../archBoard/ScenarioForm";
import { useSaveScenarioMutation } from "../archBoard/queries";
import { useScenarioCatalog } from "../archBoard/useScenarioCatalog";
import { Field } from "../components/shared";
import { fieldStyle as inputStyle, miniBtn } from "../components/fieldStyles";
import { textareaStyle } from "./styles";
import { EMPTY_FORM } from "./types";
import type { StoryForm as StoryFormType } from "./types";

export function StoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<StoryFormType>;
  onSave: (form: StoryFormType) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<StoryFormType>({ ...EMPTY_FORM, ...initial });
  const [creatingScenario, setCreatingScenario] = useState(false);
  const { scenarioOptions } = useScenarioCatalog();
  const saveScenario = useSaveScenarioMutation((saved) => {
    setForm((f) => ({ ...f, scenarioId: saved.id }));
    setCreatingScenario(false);
  });
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div
      style={{
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
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <Field label={t("stories.fieldTitle")}>
          <input
            style={inputStyle}
            value={form.title}
            onChange={set("title")}
            placeholder={t("stories.fieldTitlePlaceholder")}
            autoFocus
          />
        </Field>
        <Combobox
          label={t("stories.fieldCompetency")}
          value={form.competency}
          options={COMPETENCIES.map((competency) => ({
            value: competency,
            label: t(`enum.competency.${competency}` as Parameters<typeof t>[0]),
            color: COMPETENCY_COLORS[competency],
          }))}
          onChange={(competency) => setForm((f) => ({ ...f, competency }))}
        />
      </div>
      <Field label={t("stories.fieldSituation")}>
        <textarea style={textareaStyle} value={form.situation} onChange={set("situation")} />
      </Field>
      <Field label={t("stories.fieldTask")}>
        <textarea style={textareaStyle} value={form.task} onChange={set("task")} />
      </Field>
      <Field label={t("stories.fieldAction")}>
        <textarea style={textareaStyle} value={form.action} onChange={set("action")} />
      </Field>
      <Field label={t("stories.fieldResult")}>
        <textarea style={textareaStyle} value={form.result} onChange={set("result")} />
      </Field>

      {/* The system behind the story: a built-in scenario, or a new one drafted from the story. */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <Combobox
          label={t("stories.fieldScenario")}
          value={form.scenarioId ?? ""}
          options={[{ label: null, options: [{ value: "", label: t("stories.noScenario") }] }, ...scenarioOptions]}
          onChange={(scenarioId) => setForm((f) => ({ ...f, scenarioId: scenarioId || null }))}
          style={{ flex: "1 1 260px" }}
        />
        {!creatingScenario && (
          <button type="button" onClick={() => setCreatingScenario(true)} style={miniBtn(colors.accentBright ?? "")}>
            {t("stories.newScenarioFromStory")}
          </button>
        )}
      </div>
      {creatingScenario && (
        <ScenarioForm
          initial={{ name: form.title, brief: [form.situation, form.task].filter(Boolean).join("\n\n") }}
          onSave={(scenario) => saveScenario.mutate(scenario)}
          onCancel={() => setCreatingScenario(false)}
          saving={saveScenario.isPending}
          error={saveScenario.error}
        />
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 8,
            color: colors.textDim,
            fontSize: font.size.body,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim()}
          style={{
            padding: "8px 16px",
            background: colors.accent,
            border: "none",
            borderRadius: 8,
            color: colors.onAccent,
            fontSize: font.size.body,
            fontWeight: 600,
            cursor: form.title.trim() ? "pointer" : "not-allowed",
            opacity: form.title.trim() ? 1 : 0.5,
          }}
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}

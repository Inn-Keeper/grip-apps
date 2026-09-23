import React, { useState } from "react";
import { NODE_TYPES, TYPE_COLORS, buildCustomChecks } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, shadow, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";
import { Combobox } from "../components/Combobox";
import { fieldStyle as inputStyle } from "../components/fieldStyles";

type ScenarioFormProps = {
  onSave: (form: object) => void;
  onCancel: () => void;
  saving: boolean;
  error: Error | null;
  /** Prefill, e.g. from the story the scenario is created for. */
  initial?: { name?: string; brief?: string };
};

export function ScenarioForm({ onSave, onCancel, saving, error, initial }: ScenarioFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [brief, setBrief] = useState(initial?.brief ?? "");
  const [budget, setBudget] = useState(12);
  const [requiredNodes, setRequiredNodes] = useState<string[]>([]);
  const [requiredEdges, setRequiredEdges] = useState<{ from: string; to: string }[]>([]);

  const labelStyle: React.CSSProperties = {
    fontSize: font.size.label,
    fontWeight: 600,
    color: colors.textFaint,
    letterSpacing: "0.03em",
  };

  const toggleNode = (type: string) =>
    setRequiredNodes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]));
  const setEdgeAt = (index: number, side: string, value: string) =>
    setRequiredEdges((prev) => prev.map((edge, i) => (i === index ? { ...edge, [side]: value } : edge)));
  const nodeTypeOptions = NODE_TYPES.map((spec) => ({
    value: spec.type,
    label: spec.label,
    color: TYPE_COLORS[spec.type],
  }));

  const canSave = name.trim() && (requiredNodes.length > 0 || requiredEdges.length > 0);
  const save = () =>
    onSave({
      name: name.trim(),
      brief: brief.trim(),
      budget,
      checks: buildCustomChecks(requiredNodes, requiredEdges),
    });

  return (
    <div
      style={{
        marginBottom: 14,
        padding: "16px 18px",
        background: colors.surface,
        border: `1px solid ${colors.borderSoft}`,
        boxShadow: shadow.card,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Bottom-aligned: the budget label wraps to two lines, the name label does not. */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, alignItems: "end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>{t("board.form.name")}</span>
          <input
            style={inputStyle}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("board.scenarioNamePlaceholder")}
            autoFocus
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>{t("board.form.budget")}</span>
          <input
            style={inputStyle}
            type="number"
            min={4}
            max={30}
            value={budget}
            onChange={(event) => setBudget(Math.max(4, Math.min(30, Number(event.target.value) || 4)))}
          />
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={labelStyle}>{t("board.form.brief")}</span>
        <textarea
          style={{ ...inputStyle, minHeight: 52, resize: "vertical" as const, lineHeight: 1.5 }}
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
        />
      </label>

      <div>
        <div style={{ ...labelStyle, marginBottom: 6 }}>{t("board.form.requiredNodes")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {NODE_TYPES.map((spec) => {
            const active = requiredNodes.includes(spec.type);
            return (
              <button
                key={spec.type}
                onClick={() => toggleNode(spec.type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: `1px solid ${active ? TYPE_COLORS[spec.type] : colors.borderSoft}`,
                  background: active ? `${TYPE_COLORS[spec.type]}25` : "transparent",
                  color: active ? colors.text : colors.textDim,
                  fontSize: font.size.label,
                  fontWeight: 600,
                }}
              >
                <BrandIcon name={nodeIconName(spec.type)} color={TYPE_COLORS[spec.type]} size={12} />
                {spec.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ ...labelStyle, marginBottom: 6 }}>{t("board.form.requiredEdges")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {requiredEdges.map((edge, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Combobox
                value={edge.from}
                options={nodeTypeOptions}
                onChange={(value) => setEdgeAt(index, "from", value)}
                style={{ flex: 1 }}
              />
              <BrandIcon name="arrowRight" color={colors.textFaint} size={12} />
              <Combobox
                value={edge.to}
                options={nodeTypeOptions}
                onChange={(value) => setEdgeAt(index, "to", value)}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => setRequiredEdges((prev) => prev.filter((_, i) => i !== index))}
                title={t("board.removeConnection")}
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: 4 }}
              >
                <BrandIcon name="close" color={colors.textFaint} size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setRequiredEdges((prev) => [...prev, { from: "client", to: "service" }])}
            style={{
              alignSelf: "flex-start",
              padding: "5px 12px",
              background: "transparent",
              border: `1px solid ${colors.borderSoft}`,
              borderRadius: 8,
              color: colors.textDim,
              fontSize: font.size.label,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("board.form.addEdge")}
          </button>
        </div>
      </div>

      {error && <p style={{ margin: 0, fontSize: font.size.small, color: colors.dangerBright }}>Save failed: {error.message}</p>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 8,
            color: colors.textDim,
            fontSize: font.size.small,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={save}
          disabled={!canSave || saving}
          style={{
            padding: "7px 16px",
            background: colors.accent,
            border: "none",
            borderRadius: 8,
            color: colors.onAccent,
            fontSize: font.size.small,
            fontWeight: 600,
            cursor: canSave && !saving ? "pointer" : "not-allowed",
            opacity: canSave && !saving ? 1 : 0.5,
          }}
        >
          {saving ? t("common.saving") : t("archBoard.saveScenario")}
        </button>
      </div>
    </div>
  );
}

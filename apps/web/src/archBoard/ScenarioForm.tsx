import React, { useState } from "react";
import { NODE_TYPES, TYPE_COLORS, buildCustomChecks } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";
import { Combobox } from "../components/Combobox";
import { inputStyle } from "../components/shared";

type ScenarioFormProps = {
  onSave: (form: object) => void;
  onCancel: () => void;
  saving: boolean;
  error: Error | null;
};

export function ScenarioForm({ onSave, onCancel, saving, error }: ScenarioFormProps) {
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState(12);
  const [requiredNodes, setRequiredNodes] = useState<string[]>([]);
  const [requiredEdges, setRequiredEdges] = useState<{ from: string; to: string }[]>([]);

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
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
        border: `1px solid ${colors.accent}60`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Name *</span>
          <input
            style={inputStyle}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("board.scenarioNamePlaceholder")}
            autoFocus
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={labelStyle}>Budget (sum of component costs)</span>
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
        <span style={labelStyle}>Brief - the problem statement you'd get in the interview</span>
        <textarea
          style={{ ...inputStyle, minHeight: 52, resize: "vertical" as const, lineHeight: 1.5 }}
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
        />
      </label>

      <div>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Required components - each is a scored check</div>
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
                  border: `1px solid ${active ? TYPE_COLORS[spec.type] : colors.border}`,
                  background: active ? `${TYPE_COLORS[spec.type]}25` : "transparent",
                  color: active ? colors.text : colors.textDim,
                  fontSize: 11,
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
        <div style={{ ...labelStyle, marginBottom: 6 }}>Required connections - scored when the edge exists</div>
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
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              color: colors.textDim,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add connection
          </button>
        </div>
      </div>

      {error && <p style={{ margin: 0, fontSize: 12, color: colors.dangerBright }}>Save failed: {error.message}</p>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            color: colors.textDim,
            fontSize: 12,
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
            fontSize: 12,
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

import { EDGE_MODES, EDGE_PROTOCOLS, meta } from "@grip-apps/core/arch";
import { t } from "@grip-apps/core/i18n";
import { colors } from "@grip-apps/core/tokens";
import type { BoardEdge, BoardNode } from "./types";

export function EdgeInspector({
  edge,
  from,
  to,
  onChange,
  onRemove,
  onClose,
}: {
  edge: BoardEdge;
  from: BoardNode | undefined;
  to: BoardNode | undefined;
  onChange: (patch: Partial<BoardEdge>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const chip = (active: boolean) => ({
    padding: "6px 12px",
    background: active ? colors.accent : "transparent",
    border: `1px solid ${active ? colors.accent : colors.border}`,
    borderRadius: 8,
    color: active ? colors.onAccent : colors.textDim,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  });

  return (
    <section
      style={{
        marginTop: 12,
        padding: "14px 16px",
        background: colors.well,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 160 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.textDim }}>{t("edge.title")}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.textBright }}>
          {from ? meta(from.type).label : "?"} → {to ? meta(to.type).label : "?"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.textDim }}>{t("edge.mode")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {EDGE_MODES.map((mode: string) => (
            <button
              key={mode}
              onClick={() => onChange({ mode: edge.mode === mode ? undefined : (mode as BoardEdge["mode"]) })}
              aria-pressed={edge.mode === mode}
              style={chip(edge.mode === mode)}
            >
              {mode === "sync" ? t("edge.sync") : t("edge.async")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 240 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.textDim }}>{t("edge.protocol")}</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {EDGE_PROTOCOLS.map((protocol: string) => (
            <button
              key={protocol}
              onClick={() => onChange({ protocol: edge.protocol === protocol ? undefined : protocol })}
              aria-pressed={edge.protocol === protocol}
              style={chip(edge.protocol === protocol)}
            >
              {protocol}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onRemove}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: `1px solid ${colors.danger}50`,
            borderRadius: 8,
            color: colors.dangerBright,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("board.removeConnection")}
        </button>
        <button
          onClick={onClose}
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
          {t("common.close")}
        </button>
      </div>
    </section>
  );
}

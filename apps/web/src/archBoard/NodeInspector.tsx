import { meta, TYPE_COLORS } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";
import type { BoardNode } from "./types";

/** Replica counts an interviewer would recognise; beyond 5 the number stops mattering. */
const REPLICA_CHOICES = [1, 2, 3, 5];

export function NodeInspector({
  node,
  onChange,
  onClose,
}: {
  node: BoardNode;
  onChange: (patch: Partial<BoardNode>) => void;
  onClose: () => void;
}) {
  const spec = meta(node.type);
  const color = TYPE_COLORS[node.type];

  return (
    <section
      style={{
        marginTop: 12,
        padding: "14px 16px",
        background: colors.well,
        border: `1px solid ${color}55`,
        borderRadius: 10,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 150 }}>
        <BrandIcon name={nodeIconName(node.type)} color={color} size={16} />
        <span style={{ fontSize: font.size.body, fontWeight: 700, color: colors.textBright }}>{spec.label}</span>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 220 }}>
        <span style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textDim }}>{t("node.partitionKey")}</span>
        <input
          value={node.partitionKey ?? ""}
          onChange={(e) => onChange({ partitionKey: e.target.value })}
          placeholder={t("node.partitionKeyPlaceholder")}
          style={{
            minHeight: 40,
            padding: "10px 12px",
            background: colors.bgDeep,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: 8,
            color: colors.text,
            fontSize: font.size.body,
          }}
        />
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textDim }}>{t("node.replicas")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          {REPLICA_CHOICES.map((count) => {
            const active = node.replicas === count;
            return (
              <button
                key={count}
                onClick={() => onChange({ replicas: active ? undefined : count })}
                aria-pressed={active}
                style={{
                  width: 34,
                  height: 30,
                  background: active ? colors.accent : "transparent",
                  border: `1px solid ${active ? colors.accent : colors.borderSoft}`,
                  borderRadius: 8,
                  color: active ? colors.onAccent : colors.textDim,
                  fontSize: font.size.small,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {count}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onClose}
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
        {t("common.close")}
      </button>
    </section>
  );
}

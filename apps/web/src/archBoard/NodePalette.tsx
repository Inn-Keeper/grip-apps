import { NODE_TYPES, TYPE_COLORS } from "@grip/core/arch";
import { colors } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";

export function NodePalette({ onAddNode }: { onAddNode: (type: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 170 }}>
      {NODE_TYPES.map((item) => (
        <button
          key={item.type}
          onClick={() => onAddNode(item.type)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: colors.surface,
            border: `1px solid ${TYPE_COLORS[item.type]}40`,
            borderRadius: 8,
            color: colors.text,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
          title={`cost ${item.cost} · maint ${item.maint}`}
        >
          <BrandIcon name={nodeIconName(item.type)} color={TYPE_COLORS[item.type]} size={16} />
          <span style={{ flex: 1 }}>{item.label}</span>
          <span style={{ color: colors.textFaint, fontSize: 10 }}>{"$".repeat(item.cost) || "free"}</span>
        </button>
      ))}
    </div>
  );
}

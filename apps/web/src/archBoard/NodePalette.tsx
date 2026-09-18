import { NODE_TYPES, TYPE_COLORS } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { nodeIconName } from "../components/brandIconNames";

// The building blocks, as a wrapping strip above the canvas so the canvas keeps the full width.
// Each chip keeps its node-type colour: node identity is the board's one colour exception.
export function NodePalette({ onAddNode }: { onAddNode: (type: string) => void }) {
  return (
    <div role="toolbar" aria-label={t("board.components")} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 6 }}>
      {NODE_TYPES.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onAddNode(item.type)}
          title={`cost ${item.cost} · maint ${item.maint}`}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "7px 9px",
            background: colors.surface, border: `1px solid ${TYPE_COLORS[item.type]}40`, borderRadius: 8,
            color: colors.text, fontSize: font.size.small, fontWeight: 600, cursor: "pointer", textAlign: "left", minWidth: 0,
          }}
        >
          <BrandIcon name={nodeIconName(item.type)} color={TYPE_COLORS[item.type]} size={15} />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          <span style={{ color: colors.textFaint, fontSize: font.size.caption }}>{"$".repeat(item.cost) || "free"}</span>
        </button>
      ))}
    </div>
  );
}

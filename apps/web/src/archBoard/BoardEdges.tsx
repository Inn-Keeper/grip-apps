import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { NODE_H, NODE_W } from "./constants";
import { nodeAxisPoint } from "./boardGeometry.js";
import type { BoardEdge, BoardNode, ConnectDrag } from "./types";

type Props = {
  edges: BoardEdge[];
  nodeById: Record<string, BoardNode>;
  selectedId: string | null;
  connectDrag: ConnectDrag | null;
  onToggle: (id: string) => void;
  size: { width: number; height: number };
};

// The arrows between nodes, plus the live line while dragging a new one.
export function BoardEdges({ edges, nodeById, selectedId, connectDrag, onToggle, size }: Props) {
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, width: size.width, height: size.height, pointerEvents: "none" }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.textDim} />
        </marker>
      </defs>
      {edges.map((e) => {
        const a = nodeById[e.from];
        const b = nodeById[e.to];
        if (!a || !b) return null;
        const sx = a.x + (b.x >= a.x ? NODE_W : 0);
        const sy = a.y + NODE_H / 2;
        const tx = b.x + (b.x >= a.x ? 0 : NODE_W);
        const ty = b.y + NODE_H / 2;
        const mx = (sx + tx) / 2;
        const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
        const selected = selectedId === e.id;
        const modeLabel = e.mode === "sync" ? t("edge.sync") : e.mode === "async" ? t("edge.async") : null;
        const label = [e.protocol, modeLabel].filter(Boolean).join(" · ");
        return (
          <g key={e.id}>
            <path
              d={d}
              fill="none"
              stroke={selected ? colors.accentBright : colors.textDim}
              strokeWidth={selected ? 3 : 2}
              // Async hops are dashed: the whiteboard convention for "this one doesn't block".
              strokeDasharray={e.mode === "async" ? "6 4" : undefined}
              markerEnd="url(#arrow)"
            />
            {label && (
              <text x={mx} y={(sy + ty) / 2 - 6} textAnchor="middle" style={{ fontSize: font.size.caption, fontWeight: 600, fill: colors.textFaint, pointerEvents: "none" }}>
                {label}
              </text>
            )}
            <path d={d} fill="none" stroke="transparent" strokeWidth="14" style={{ pointerEvents: "stroke", cursor: "pointer" }} onClick={() => onToggle(e.id)}>
              <title>{t("edge.clickHint")}</title>
            </path>
          </g>
        );
      })}
      {connectDrag && nodeById[connectDrag.from] && (() => {
        const start = nodeAxisPoint(nodeById[connectDrag.from]!, connectDrag, { width: NODE_W, height: NODE_H });
        const mx = (start.x + connectDrag.x) / 2;
        const d = `M ${start.x} ${start.y} C ${mx} ${start.y}, ${mx} ${connectDrag.y}, ${connectDrag.x} ${connectDrag.y}`;
        return <path d={d} fill="none" stroke={colors.accentBright} strokeWidth="2" strokeDasharray="5 5" markerEnd="url(#arrow)" />;
      })()}
    </svg>
  );
}

import { useQuery } from "@tanstack/react-query";
import { SCENARIOS, TYPE_COLORS, evaluate, meta } from "@grip-apps/core/arch";
import { t } from "@grip-apps/core/i18n";
import { brand, colors } from "@grip-apps/core/tokens";
import { getSharedBoard } from "../lib/api";
import { BrandIcon } from "../components/BrandIcon";
import { EvalResults } from "./EvalResults";
import type { AugmentedScenario, BoardEdge, BoardNode } from "./types";

const NODE_W = 96;
const NODE_H = 44;
const CANVAS_PAD = 40;

// Read-only SVG snapshot of a board — no gestures, no editing, no auth.
function BoardSnapshot({ nodes, edges }: { nodes: BoardNode[]; edges: BoardEdge[] }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const maxX = Math.max(...nodes.map((n) => n.x), 0) + NODE_W + CANVAS_PAD;
  const maxY = Math.max(...nodes.map((n) => n.y), 0) + NODE_H + CANVAS_PAD;
  const minX = Math.min(...nodes.map((n) => n.x), 0) - CANVAS_PAD;
  const minY = Math.min(...nodes.map((n) => n.y), 0) - CANVAS_PAD;

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      style={{ width: "100%", maxHeight: 520, background: colors.bgDeep, borderRadius: 14, border: `1px solid ${colors.border}` }}
    >
      <defs>
        <marker id="share-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill={colors.textFaint} />
        </marker>
      </defs>
      {edges.map((edge) => {
        const from = byId[edge.from];
        const to = byId[edge.to];
        if (!from || !to) return null;
        return (
          <line
            key={edge.id}
            x1={from.x + NODE_W / 2}
            y1={from.y + NODE_H / 2}
            x2={to.x + NODE_W / 2}
            y2={to.y + NODE_H / 2}
            stroke={colors.textFaint}
            strokeWidth={1.5}
            markerEnd="url(#share-arrow)"
          />
        );
      })}
      {nodes.map((node) => {
        const spec = meta(node.type);
        const color = TYPE_COLORS[node.type] ?? colors.accent;
        return (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={NODE_H}
              rx={10}
              fill={colors.surface}
              stroke={color}
              strokeWidth={1.5}
            />
            <text x={node.x + NODE_W / 2} y={node.y + 19} textAnchor="middle" fontSize={13}>
              {spec.emoji}
            </text>
            <text
              x={node.x + NODE_W / 2}
              y={node.y + 34}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill={colors.text}
            >
              {spec.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SharedBoardPage({ token }: { token: string }) {
  const { data: board, isLoading, error } = useQuery({
    queryKey: ["shared-board", token],
    queryFn: () => getSharedBoard(token),
    retry: false,
  });

  const scenario = board
    ? (SCENARIOS.find((s: { id: string }) => s.id === board.scenarioId) as AugmentedScenario | undefined)
    : undefined;
  const result =
    board && scenario
      ? evaluate(scenario as Parameters<typeof evaluate>[0], board.nodes, board.edges)
      : null;

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 20px 60px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "min(100%, 960px)", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandIcon name="spark" color={colors.accentBright} size={22} />
          <span style={{ fontSize: 15, fontWeight: 800, color: colors.textBright }}>{brand.productName}</span>
          <span style={{ fontSize: 12, color: colors.textFaint }}>· {t("board.sharedTitle")}</span>
        </div>

        {isLoading && <p style={{ color: colors.textFaint, fontSize: 13 }}>{t("common.loading")}</p>}

        {!isLoading && (error || !board) && (
          <p style={{ color: colors.dangerBright, fontSize: 13 }}>{t("board.sharedNotFound")}</p>
        )}

        {board && (
          <>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 850, color: colors.textBright }}>
                {board.title}
              </h1>
              <p style={{ margin: 0, fontSize: 12.5, color: colors.textFaint }}>
                {scenario ? scenario.name : board.scenarioId} · {t("board.sharedReadOnly")}
              </p>
              {scenario && (
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: colors.textDim, maxWidth: 720 }}>
                  {scenario.brief}
                </p>
              )}
            </div>

            <BoardSnapshot nodes={board.nodes} edges={board.edges} />

            {result && scenario ? (
              <EvalResults result={result} scenario={scenario} />
            ) : (
              <p style={{ margin: 0, fontSize: 12.5, color: colors.textFaint }}>{t("board.sharedScenarioMissing")}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

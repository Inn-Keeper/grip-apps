import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";

const HEIGHT = 90;
const WIDTH = 600; // viewBox units; scales to container width
const PAD_X = 12;
const PAD_Y = 14;

type AccuracyPoint = { date: string; accuracy: number };

// SVG twin of the mobile Skia chart: cumulative accuracy per day.
export function AccuracyChart({ points, compact = false }: { points: AccuracyPoint[]; compact?: boolean }) {
  const latest = points.at(-1);
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;
  const maxIndex = Math.max(1, points.length - 1);
  const dots = points.map((point, index) => ({
    key: point.date,
    x: PAD_X + (index / maxIndex) * innerW,
    y: PAD_Y + (1 - point.accuracy) * innerH,
  }));
  const path = dots.map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`).join(" ");

  return (
    <div
      style={{
        background: colors.well,
        border: `1px solid ${colors.border}`,
        borderRadius: compact ? 8 : 12,
        padding: compact ? "12px 14px 8px" : "12px 14px",
        marginBottom: compact ? 0 : 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.textBright }}>{t("accuracy.title")}</div>
          <div style={{ fontSize: 10.5, color: colors.textFaint }}>{t("accuracy.subtitle")}</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: latest && latest.accuracy >= 0.7 ? colors.success : colors.warning }}>
          {latest ? `${Math.round(latest.accuracy * 100)}%` : "--"}
        </span>
      </div>

      {points.length < 2 ? (
        <div style={{ height: compact ? 64 : HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textFaint, fontSize: 11 }}>
          {t("accuracy.empty")}
        </div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: compact ? 64 : HEIGHT, display: "block" }}>
          <path
            d={`M ${PAD_X} ${PAD_Y} L ${PAD_X} ${HEIGHT - PAD_Y} L ${WIDTH - PAD_X} ${HEIGHT - PAD_Y}`}
            fill="none"
            stroke={colors.border}
            strokeWidth="1"
          />
          <path d={path} fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinejoin="round" />
          {dots.map((dot, index) => (
            <circle
              key={dot.key}
              cx={dot.x}
              cy={dot.y}
              r={index === dots.length - 1 ? 4 : 2.5}
              fill={index === dots.length - 1 ? colors.success : colors.accent}
            />
          ))}
        </svg>
      )}
    </div>
  );
}

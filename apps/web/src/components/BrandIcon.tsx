import { colors } from "@grip/core/tokens";

// Web port of apps/mobile/src/components/BrandIcon.tsx — keep the icon
// geometry in sync with the mobile component ("search" is web-only).

const FLAGS: Record<string, React.ReactNode> = {
  flagUS: (
    <svg viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block", borderRadius: 2 }}>
      {[0,1,2,3,4,5,6,7,8,9,10,11,12].map((i) => (
        <rect key={i} x="0" y={i * (14/13)} width="20" height={14/13} fill={i % 2 === 0 ? "#B22234" : "#FFFFFF"} />
      ))}
      <rect x="0" y="0" width="8" height={14 * 7/13} fill="#3C3B6E" />
      {[0,1,2,3,4,5,6,7,8].map((col) => [0,1,2,3,4].map((row) => (
        <circle key={`${col}-${row}`} cx={0.8 + col * 0.85} cy={0.6 + row * 1.1} r="0.28" fill="#FFFFFF" />
      )))}
    </svg>
  ),
  flagBR: (
    <svg viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block", borderRadius: 2 }}>
      <rect x="0" y="0" width="20" height="14" fill="#009C3B" />
      <polygon points="10,1.5 18.5,7 10,12.5 1.5,7" fill="#FFDF00" />
      <circle cx="10" cy="7" r="3" fill="#002776" />
    </svg>
  ),
  flagSE: (
    <svg viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block", borderRadius: 2 }}>
      <rect x="0" y="0" width="20" height="14" fill="#006AA7" />
      <rect x="0" y="5.5" width="20" height="3" fill="#FECC02" />
      <rect x="6" y="0" width="3" height="14" fill="#FECC02" />
    </svg>
  ),
};

import React from "react";

type Piece =
  | { kind?: undefined; x: number; y: number; w: number; h: number; r?: number; fill?: boolean; opacity?: number; rotate?: string }
  | { kind: "dot"; x: number; y: number; w: number; h: number; fill?: boolean; opacity?: number; rotate?: string; r?: never }
  | { kind: "line"; x: number; y: number; w: number; h: number; rotate?: string; opacity?: number; r?: never; fill?: never };

const ICONS: Record<string, Piece[]> = {
  accuracy: [
    { x: 3, y: 17, w: 18, h: 2, r: 1 },
    { x: 5, y: 13, w: 2, h: 4, r: 1, fill: true },
    { x: 10, y: 9, w: 2, h: 8, r: 1, fill: true },
    { x: 15, y: 5, w: 2, h: 12, r: 1, fill: true },
    { kind: "dot", x: 4, y: 12, w: 4, h: 4, fill: true },
    { kind: "dot", x: 9, y: 8, w: 4, h: 4, fill: true },
    { kind: "dot", x: 14, y: 4, w: 4, h: 4, fill: true },
  ],
  arrowDown: [{ kind: "line", x: 3.76, y: 11, w: 10.49, h: 2, rotate: "45deg" }, { kind: "line", x: 9.76, y: 11, w: 10.49, h: 2, rotate: "-45deg" }],
  arrowRight: [{ kind: "line", x: 3, y: 11, w: 17, h: 2 }, { kind: "line", x: 11.96, y: 8.5, w: 9.07, h: 2, rotate: "45deg" }, { kind: "line", x: 11.96, y: 13.5, w: 9.07, h: 2, rotate: "135deg" }],
  arrowUp: [{ kind: "line", x: 3.76, y: 11, w: 10.49, h: 2, rotate: "-45deg" }, { kind: "line", x: 9.76, y: 11, w: 10.49, h: 2, rotate: "45deg" }],
  board: [{ x: 4, y: 4, w: 6, h: 6 }, { x: 14, y: 4, w: 6, h: 6 }, { x: 4, y: 14, w: 6, h: 6 }, { x: 14, y: 14, w: 6, h: 6 }],
  cache: [{ x: 6, y: 5, w: 12, h: 14, r: 3 }, { kind: "line", x: 8, y: 12, w: 8, h: 0 }, { kind: "line", x: 12, y: 7, w: 0, h: 10 }],
  lock: [{ x: 5, y: 11, w: 14, h: 9, r: 2 }, { x: 8, y: 5, w: 8, h: 7, r: 4 }],
  info: [{ x: 4, y: 4, w: 16, h: 16, r: 8 }, { kind: "line", x: 11, y: 10.5, w: 0, h: 6 }, { x: 11, y: 7, w: 2, h: 2, r: 1, fill: true }],
  clock: [{ x: 4, y: 4, w: 16, h: 16, r: 8 }, { kind: "line", x: 12, y: 7.5, w: 0, h: 5 }, { kind: "line", x: 12, y: 12, w: 3.5, h: 0 }],
  calendar: [{ x: 4, y: 6, w: 16, h: 14, r: 3 }, { kind: "line", x: 4, y: 10, w: 16, h: 0 }, { kind: "line", x: 8, y: 4, w: 0, h: 4 }, { kind: "line", x: 16, y: 4, w: 0, h: 4 }],
  check: [{ kind: "line", x: 2.96, y: 13.5, w: 9.07, h: 2, rotate: "45deg" }, { kind: "line", x: 6.77, y: 11, w: 15.45, h: 2, rotate: "-48deg" }],
  client: [{ x: 5, y: 5, w: 14, h: 11, r: 2 }, { kind: "line", x: 9, y: 19, w: 6, h: 0 }, { kind: "line", x: 12, y: 16, w: 0, h: 3 }],
  // Strokes are thin bars (h: 2) centered on their segment and rotated; a "line" with
  // both w and h large paints a filled box, not a diagonal.
  // Two thin bars crossing at the center (12, 12).
  close: [{ kind: "line", x: 4, y: 11, w: 16, h: 2, rotate: "45deg" }, { kind: "line", x: 4, y: 11, w: 16, h: 2, rotate: "-45deg" }],
  cloud: [{ x: 5, y: 10, w: 14, h: 8, r: 4 }, { x: 8, y: 6, w: 8, h: 8, r: 4 }],
  code: [{ kind: "line", x: 0.96, y: 8.5, w: 9.07, h: 2, rotate: "135deg" }, { kind: "line", x: 0.96, y: 13.5, w: 9.07, h: 2, rotate: "45deg" }, { kind: "line", x: 13.96, y: 8.5, w: 9.07, h: 2, rotate: "45deg" }, { kind: "line", x: 13.96, y: 13.5, w: 9.07, h: 2, rotate: "135deg" }, { kind: "line", x: 3.72, y: 11, w: 16.56, h: 2, rotate: "106deg" }],
  contact: [{ kind: "dot", x: 9, y: 4, w: 6, h: 6 }, { x: 6, y: 13, w: 12, h: 7, r: 4 }],
  cost: [{ kind: "dot", x: 5, y: 8, w: 8, h: 8 }, { kind: "dot", x: 11, y: 8, w: 8, h: 8 }, { kind: "line", x: 12, y: 5, w: 0, h: 14 }],
  database: [{ x: 5, y: 5, w: 14, h: 5, r: 3 }, { kind: "line", x: 5, y: 8, w: 0, h: 9 }, { kind: "line", x: 19, y: 8, w: 0, h: 9 }, { x: 5, y: 14, w: 14, h: 5, r: 3 }],
  done: [{ x: 4, y: 4, w: 16, h: 16, r: 8 }, { kind: "line", x: 6.38, y: 12.5, w: 6.24, h: 2, rotate: "45deg" }, { kind: "line", x: 8.59, y: 11, w: 9.81, h: 2, rotate: "-50deg" }],
  drill: [{ x: 4, y: 4, w: 16, h: 16, r: 8 }, { x: 8, y: 8, w: 8, h: 8, r: 4 }, { kind: "dot", x: 11, y: 11, w: 2, h: 2, fill: true }],
  error: [{ x: 4, y: 4, w: 16, h: 16, r: 8 }, { kind: "line", x: 6.76, y: 11, w: 10.49, h: 2, rotate: "45deg" }, { kind: "line", x: 6.76, y: 11, w: 10.49, h: 2, rotate: "135deg" }],
  evaluate: [{ x: 5, y: 5, w: 14, h: 14, r: 3 }, { kind: "line", x: 6.38, y: 12.5, w: 6.24, h: 2, rotate: "45deg" }, { kind: "line", x: 8.59, y: 11, w: 9.81, h: 2, rotate: "-50deg" }],
  fit: [{ x: 5, y: 5, w: 5, h: 5 }, { x: 14, y: 5, w: 5, h: 5 }, { x: 5, y: 14, w: 5, h: 5 }, { x: 14, y: 14, w: 5, h: 5 }],
  gateway: [{ x: 6, y: 4, w: 12, h: 16, r: 2 }, { kind: "line", x: 12, y: 8, w: 0, h: 8 }, { kind: "dot", x: 14, y: 12, w: 2, h: 2, fill: true }],
  globe: [{ x: 4, y: 4, w: 16, h: 16, r: 8 }, { kind: "line", x: 4, y: 12, w: 16, h: 0 }, { kind: "line", x: 12, y: 4, w: 0, h: 16 }],
  layers: [{ x: 5, y: 6, w: 14, h: 5, r: 2 }, { x: 5, y: 10, w: 14, h: 5, r: 2 }, { x: 5, y: 14, w: 14, h: 5, r: 2 }],
  maintenance: [{ x: 5, y: 11, w: 14, h: 4, r: 2, rotate: "-35deg" }, { kind: "dot", x: 4, y: 10, w: 5, h: 5 }, { kind: "dot", x: 15, y: 9, w: 5, h: 5 }],
  monitor: [{ x: 4, y: 5, w: 16, h: 13, r: 2 }, { kind: "line", x: 7, y: 13, w: 3, h: 0 }, { kind: "line", x: 10, y: 13, w: 3, h: 0, rotate: "-60deg" }, { kind: "line", x: 13, y: 10, w: 4, h: 0, rotate: "60deg" }],
  payment: [{ x: 4, y: 7, w: 16, h: 11, r: 2 }, { kind: "line", x: 4, y: 10, w: 16, h: 0 }, { kind: "line", x: 7, y: 15, w: 5, h: 0 }],
  profile: [{ kind: "dot", x: 9, y: 4, w: 6, h: 6 }, { x: 6, y: 13, w: 12, h: 7, r: 4 }],
  prompt: [{ x: 6, y: 4, w: 12, h: 14, r: 6 }, { kind: "line", x: 12, y: 18, w: 0, h: 3 }, { kind: "line", x: 9, y: 21, w: 6, h: 0 }],
  queue: [{ kind: "line", x: 5, y: 7, w: 14, h: 0 }, { kind: "line", x: 5, y: 12, w: 14, h: 0 }, { kind: "line", x: 5, y: 17, w: 14, h: 0 }, { kind: "dot", x: 4, y: 5, w: 4, h: 4 }, { kind: "dot", x: 4, y: 10, w: 4, h: 4 }, { kind: "dot", x: 4, y: 15, w: 4, h: 4 }],
  // Fly Me: a raised wing (curved leading edge, four feather tips).
  fly: [{ kind: "line", x: -1.61, y: 15.5, w: 11.22, h: 2, rotate: "-77deg" }, { kind: "line", x: 2.59, y: 8, w: 9.81, h: 2, rotate: "-50deg" }, { kind: "line", x: 8.8, y: 3.5, w: 13.4, h: 2, rotate: "-15deg" }, { kind: "line", x: 13.09, y: 4.5, w: 9.81, h: 2, rotate: "140deg" }, { kind: "line", x: 13.38, y: 8.5, w: 6.24, h: 2, rotate: "45deg" }, { kind: "line", x: 10.96, y: 10.5, w: 8.08, h: 2, rotate: "171deg" }, { kind: "line", x: 9.44, y: 13, w: 6.12, h: 2, rotate: "76deg" }, { kind: "line", x: 6.95, y: 14.5, w: 7.1, h: 2, rotate: "-169deg" }, { kind: "line", x: 5, y: 16, w: 6, h: 2, rotate: "90deg" }, { kind: "line", x: 1.81, y: 19, w: 7.39, h: 2, rotate: "158deg" }],
  // Quest: a flag on a pole — a goal you are working toward.
  quest: [{ kind: "line", x: 5, y: 3, w: 2, h: 18 }, { x: 6, y: 4, w: 13, h: 9, r: 2 }],
  rank: [{ x: 5, y: 6, w: 14, h: 11, r: 3 }, { kind: "line", x: 8, y: 5, w: 0, h: 5 }, { kind: "line", x: 16, y: 5, w: 0, h: 5 }, { kind: "line", x: 10, y: 19, w: 4, h: 0 }],
  retro: [{ x: 6, y: 5, w: 12, h: 15, r: 2 }, { kind: "line", x: 9, y: 9, w: 6, h: 0 }, { kind: "line", x: 9, y: 13, w: 6, h: 0 }, { kind: "line", x: 9, y: 17, w: 4, h: 0 }],
  saved: [{ x: 6, y: 4, w: 12, h: 16, r: 2 }, { kind: "line", x: 9, y: 4, w: 2, h: 7 }, { kind: "line", x: 13, y: 4, w: 2, h: 7 }, { kind: "line", x: 8, y: 10, w: 8, h: 2 }],
  search: [{ x: 4, y: 4, w: 12, h: 12, r: 6 }, { kind: "line", x: 13, y: 16, w: 7, h: 0, rotate: "45deg" }],
  service: [{ x: 7, y: 5, w: 10, h: 14, r: 3 }, { kind: "line", x: 4, y: 9, w: 4, h: 0 }, { kind: "line", x: 16, y: 9, w: 4, h: 0 }, { kind: "line", x: 4, y: 15, w: 4, h: 0 }, { kind: "line", x: 16, y: 15, w: 4, h: 0 }],
  shield: [{ x: 6, y: 4, w: 12, h: 16, r: 6 }, { kind: "line", x: 12, y: 7, w: 0, h: 9 }],
  // A four-point star (✦): cross + diamond core, every piece centered on (12, 12).
  spark: [{ kind: "line", x: 11, y: 4, w: 2, h: 16 }, { kind: "line", x: 4, y: 11, w: 16, h: 2 }, { kind: "line", x: 8, y: 8, w: 8, h: 8, rotate: "45deg" }],
  story: [{ x: 6, y: 4, w: 12, h: 16, r: 2 }, { kind: "line", x: 9, y: 8, w: 6, h: 0 }, { kind: "line", x: 9, y: 12, w: 6, h: 0 }, { kind: "line", x: 9, y: 16, w: 4, h: 0 }],
  test: [{ x: 7, y: 4, w: 10, h: 16, r: 2 }, { kind: "line", x: 9, y: 9, w: 6, h: 0 }, { kind: "line", x: 9, y: 13, w: 6, h: 0 }, { kind: "dot", x: 10, y: 16, w: 4, h: 4 }],
  warning: [{ kind: "line", x: 6.75, y: 10.5, w: 19.49, h: 2, rotate: "59deg" }, { kind: "line", x: 2, y: 18, w: 20, h: 2 }, { kind: "line", x: -2.25, y: 10.5, w: 19.49, h: 2, rotate: "-59deg" }, { kind: "line", x: 11, y: 8, w: 2, h: 6 }, { kind: "dot", x: 11, y: 15, w: 2, h: 2, fill: true }],
  worker: [{ x: 5, y: 7, w: 14, h: 10, r: 5 }, { kind: "line", x: 12, y: 4, w: 0, h: 16 }, { kind: "line", x: 7, y: 12, w: 10, h: 0 }],
};

type BrandIconProps = { name: string; color?: string; size?: number; muted?: boolean };

export function BrandIcon({ name, color = colors.textDim, size = 18, muted = false }: BrandIconProps) {
  const scale = size / 24;
  const flag = FLAGS[name];
  if (flag) {
    return (
      <span style={{ width: size, height: Math.round(size * 14 / 20), display: "inline-block", flexShrink: 0, opacity: muted ? 0.62 : 1, overflow: "hidden", borderRadius: 2 }}>
        {flag}
      </span>
    );
  }
  const pieces = ICONS[name] ?? ICONS["spark"]!;
  return (
    <span
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-block",
        flexShrink: 0,
        opacity: muted ? 0.62 : 1,
      }}
    >
      {pieces.map((piece, index) => {
        const stroke = Math.max(1, Math.round(2 * scale));
        const common: React.CSSProperties = {
          position: "absolute",
          boxSizing: "border-box",
          left: piece.x * scale,
          top: piece.y * scale,
          width: Math.max(stroke, piece.w * scale),
          height: Math.max(stroke, piece.h * scale),
          opacity: piece.opacity ?? 1,
          transform: piece.rotate ? `rotate(${piece.rotate})` : undefined,
        };
        if (piece.kind === "line") {
          return <span key={index} style={{ ...common, background: color, borderRadius: stroke / 2 }} />;
        }
        return (
          <span
            key={index}
            style={{
              ...common,
              border: piece.fill ? "none" : `${stroke}px solid ${color}`,
              background: piece.fill ? color : "transparent",
              borderRadius: (piece.r ?? Math.max(piece.w, piece.h) / 2) * scale,
            }}
          />
        );
      })}
    </span>
  );
}

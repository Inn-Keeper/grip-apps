import { View } from "react-native";
import { colors } from "@/theme";

export type BrandIconName =
  | "accuracy"
  | "arrowDown"
  | "arrowRight"
  | "arrowUp"
  | "board"
  | "cache"
  | "calendar"
  | "check"
  | "client"
  | "close"
  | "cloud"
  | "code"
  | "contact"
  | "cost"
  | "database"
  | "done"
  | "drill"
  | "error"
  | "evaluate"
  | "fit"
  | "gateway"
  | "globe"
  | "layers"
  | "maintenance"
  | "monitor"
  | "payment"
  | "prompt"
  | "quest"
  | "queue"
  | "rank"
  | "retro"
  | "saved"
  | "search"
  | "service"
  | "shield"
  | "spark"
  | "story"
  | "test"
  | "warning"
  | "worker";

type Props = { name: BrandIconName; color?: string; size?: number; muted?: boolean };

type Piece = {
  kind?: "line" | "dot";
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  rotate?: string;
  fill?: boolean;
  opacity?: number;
};

const ICONS: Record<BrandIconName, Piece[]> = {
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
  prompt: [{ x: 6, y: 4, w: 12, h: 14, r: 6 }, { kind: "line", x: 12, y: 18, w: 0, h: 3 }, { kind: "line", x: 9, y: 21, w: 6, h: 0 }],
  queue: [{ kind: "line", x: 5, y: 7, w: 14, h: 0 }, { kind: "line", x: 5, y: 12, w: 14, h: 0 }, { kind: "line", x: 5, y: 17, w: 14, h: 0 }, { kind: "dot", x: 4, y: 5, w: 4, h: 4 }, { kind: "dot", x: 4, y: 10, w: 4, h: 4 }, { kind: "dot", x: 4, y: 15, w: 4, h: 4 }],
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

export const nodeIconName = (type: string): BrandIconName => {
  const map: Record<string, BrandIconName> = {
    client: "client",
    cdn: "globe",
    lb: "layers",
    gateway: "gateway",
    auth: "shield",
    service: "service",
    worker: "worker",
    queue: "queue",
    cache: "cache",
    sql: "database",
    nosql: "database",
    blob: "cloud",
    search: "search",
    stream: "arrowRight",
    psp: "payment",
    monitor: "monitor",
  };
  return map[type] ?? "service";
};

export const categoryIconName = (name: string): BrandIconName => {
  const map: Record<string, BrandIconName> = {
    Languages: "code",
    Frontend: "client",
    Backend: "service",
    Cloud: "cloud",
    Monitoring: "monitor",
    AI: "spark",
    Testing: "test",
    Mobile: "client",
    Databases: "database",
  };
  // Keyed by the first word: category names are "Frontend & Mobile", "AI Tooling", ...
  return map[name.split(" ")[0] ?? name] ?? "spark";
};

export function BrandIcon({ name, color = colors.textDim, size = 18, muted = false }: Props) {
  const scale = size / 24;
  return (
    <View style={{ width: size, height: size, position: "relative", opacity: muted ? 0.62 : 1 }}>
      {(ICONS[name] ?? ICONS.spark).map((piece, index) => {
        const stroke = Math.max(1, Math.round(2 * scale));
        const common = {
          position: "absolute" as const,
          left: piece.x * scale,
          top: piece.y * scale,
          width: Math.max(stroke, piece.w * scale),
          height: Math.max(stroke, piece.h * scale),
          opacity: piece.opacity ?? 1,
          // Never undefined: when an icon swaps in place (e.g. the timer's spark → close), React Native
          // sends null for a removed transform and crashes; an empty array clears it safely.
          transform: piece.rotate ? [{ rotate: piece.rotate }] : [],
        };
        if (piece.kind === "line") {
          return <View key={index} style={[common, { backgroundColor: color, borderRadius: stroke / 2 }]} />;
        }
        return (
          <View
            key={index}
            style={[
              common,
              {
                borderWidth: piece.fill ? 0 : stroke,
                borderColor: color,
                backgroundColor: piece.fill ? color : "transparent",
                borderRadius: (piece.r ?? Math.max(piece.w, piece.h) / 2) * scale,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

import { useEffect, useImperativeHandle, useState, type Ref } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Canvas, DashPathEffect, Group, Path } from "@shopify/react-native-skia";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { BoardEdge, BoardNode } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { NODE_H, NODE_W, NodeView } from "./NodeView";

const EDGE_COLOR = colors.textDim;
const EDGE_TAP_TOLERANCE = 18;
// Dropping a dragged wire within this distance of a node's center snaps to it.
const SNAP_RADIUS = 90;

// Virtual canvas: nodes live in this coordinate space; the viewport
// (scale + translate) maps it onto the screen.
export const CANVAS = { width: 1600, height: 1200 };
const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const FIT_PADDING = 48;
const ZOOM_STEP = 1.25;
// Canvas width that fills the screen at the base zoom: nodes shrink on phones and
// stay full size on tablets, instead of always starting at 100%.
const BASE_VISIBLE_WIDTH = 560;
const MIN_BASE_SCALE = 0.55;
// The floating palette and zoom controls sit over the canvas bottom; keep fitted nodes clear of them.
const BOTTOM_OVERLAY = 76;
const SPRING = { damping: 18 };

/** Lets the screen place new nodes where the user is currently looking. */
export type BoardCanvasHandle = { visibleOrigin: () => { x: number; y: number } };

type PendingEdge = { fromId: string; x: number; y: number };

type Props = {
  nodes: BoardNode[];
  edges: BoardEdge[];
  onMoveNode: (id: string, x: number, y: number) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (fromId: string, toId: string) => void;
  onTapEdge: (id: string) => void;
  onInspectNode: (id: string) => void;
  /** Changes when a different board or scenario is shown; the view re-fits to it. */
  fitKey: number;
  ref?: Ref<BoardCanvasHandle>;
};

type EdgeGeometry = { sx: number; sy: number; tx: number; ty: number; mx: number };

function edgeGeometry(a: BoardNode, b: BoardNode): EdgeGeometry {
  const sx = a.x + (b.x >= a.x ? NODE_W : 0);
  const sy = a.y + NODE_H / 2;
  const tx = b.x + (b.x >= a.x ? 0 : NODE_W);
  const ty = b.y + NODE_H / 2;
  return { sx, sy, tx, ty, mx: (sx + tx) / 2 };
}

function bezierPath({ sx, sy, tx, ty, mx }: EdgeGeometry): string {
  return `M ${sx} ${sy} C ${mx} ${sy} ${mx} ${ty} ${tx} ${ty}`;
}

function arrowheadPath({ tx, ty, mx }: EdgeGeometry): string {
  const direction = tx >= mx ? 1 : -1;
  const back = tx - 9 * direction;
  return `M ${tx} ${ty} L ${back} ${ty - 5} L ${back} ${ty + 5} Z`;
}

/** Distance from a tap to the closest of `samples` points along the bezier. */
function distanceToEdge(geometry: EdgeGeometry, px: number, py: number, samples = 16): number {
  const { sx, sy, tx, ty, mx } = geometry;
  let min = Infinity;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    // Cubic bezier with control points (mx, sy) and (mx, ty).
    const bx = u ** 3 * sx + 3 * u ** 2 * t * mx + 3 * u * t ** 2 * mx + t ** 3 * tx;
    const by = u ** 3 * sy + 3 * u ** 2 * t * sy + 3 * u * t ** 2 * ty + t ** 3 * ty;
    min = Math.min(min, Math.hypot(bx - px, by - py));
  }
  return min;
}

export function BoardCanvas({ nodes, edges, onMoveNode, onRemoveNode, onAddEdge, onTapEdge, onInspectNode, fitKey, ref }: Props) {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [pending, setPending] = useState<PendingEdge | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  // Viewport: screen = canvas * scale + translate (origin top-left).
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pinchStart = useSharedValue({ s: 1, tx: 0, ty: 0, fx: 0, fy: 0 });
  const panStart = useSharedValue({ tx: 0, ty: 0 });
  const [zoomPercent, setZoomPercent] = useState(100);
  useAnimatedReaction(
    () => Math.round(scale.value * 100),
    (percent, previous) => {
      if (percent !== previous) runOnJS(setZoomPercent)(percent);
    }
  );
  const baseScale = Math.max(MIN_BASE_SCALE, Math.min(1, boardSize.width / BASE_VISIBLE_WIDTH));

  useImperativeHandle(ref, () => ({
    visibleOrigin: () => ({
      x: Math.max(0, -translateX.value / scale.value),
      y: Math.max(0, -translateY.value / scale.value),
    }),
  }));

  // Marching-ants phase for the pending connector, looping on the UI thread.
  const dashPhase = useSharedValue(0);
  useEffect(() => {
    dashPhase.value = withRepeat(withTiming(-36, { duration: 700, easing: Easing.linear }), -1);
  }, [dashPhase]);

  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));

  const clampTranslate = (value: number, viewport: number, content: number, s: number) => {
    "worklet";
    const lo = Math.min(0, viewport - content * s);
    const hi = Math.max(0, viewport - content * s);
    return Math.max(lo, Math.min(hi, value));
  };

  // Pinch: zoom around the focal point; moving both fingers also pans,
  // because the canvas point under the initial focal stays under the finger.
  const pinch = Gesture.Pinch()
    .onStart((event) => {
      pinchStart.value = {
        s: scale.value,
        tx: translateX.value,
        ty: translateY.value,
        fx: event.focalX,
        fy: event.focalY,
      };
    })
    .onUpdate((event) => {
      const start = pinchStart.value;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, start.s * event.scale));
      const ratio = next / start.s;
      scale.value = next;
      translateX.value = clampTranslate(
        event.focalX - (start.fx - start.tx) * ratio, boardSize.width, CANVAS.width, next
      );
      translateY.value = clampTranslate(
        event.focalY - (start.fy - start.ty) * ratio, boardSize.height, CANVAS.height, next
      );
    });

  // One-finger pan on empty space. Node drags win the race on nodes
  // because their pan activates at a shorter distance.
  const panBackground = Gesture.Pan()
    .maxPointers(1)
    .minDistance(12)
    .onStart(() => {
      panStart.value = { tx: translateX.value, ty: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = clampTranslate(
        panStart.value.tx + event.translationX, boardSize.width, CANVAS.width, scale.value
      );
      translateY.value = clampTranslate(
        panStart.value.ty + event.translationY, boardSize.height, CANVAS.height, scale.value
      );
    });

  /** Frames every node in the viewport — the "see everything in one shot" button. Never zooms past the base scale. */
  const fitAll = () => {
    if (boardSize.width === 0) return;
    if (nodes.length === 0) {
      scale.value = withSpring(baseScale, SPRING);
      translateX.value = withSpring(0, SPRING);
      translateY.value = withSpring(0, SPRING);
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x)) - FIT_PADDING;
    const minY = Math.min(...nodes.map((n) => n.y)) - FIT_PADDING;
    const maxX = Math.max(...nodes.map((n) => n.x + NODE_W)) + FIT_PADDING;
    const maxY = Math.max(...nodes.map((n) => n.y + NODE_H)) + FIT_PADDING;
    const usableHeight = Math.max(120, boardSize.height - BOTTOM_OVERLAY);
    const fitScale = Math.max(
      MIN_SCALE,
      Math.min(boardSize.width / (maxX - minX), usableHeight / (maxY - minY), baseScale)
    );
    scale.value = withSpring(fitScale, SPRING);
    translateX.value = withSpring((boardSize.width - (maxX - minX) * fitScale) / 2 - minX * fitScale, SPRING);
    translateY.value = withSpring((usableHeight - (maxY - minY) * fitScale) / 2 - minY * fitScale, SPRING);
  };

  /** Button zoom keeps the screen center fixed. */
  const zoomBy = (factor: number) => {
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value * factor));
    const ratio = next / scale.value;
    const cx = boardSize.width / 2;
    const cy = boardSize.height / 2;
    scale.value = withSpring(next, SPRING);
    translateX.value = withSpring(
      clampTranslate(cx - (cx - translateX.value) * ratio, boardSize.width, CANVAS.width, next), SPRING
    );
    translateY.value = withSpring(
      clampTranslate(cy - (cy - translateY.value) * ratio, boardSize.height, CANVAS.height, next), SPRING
    );
  };

  // Re-frame when the board or scenario changes, and once the canvas has a size.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fitAll, [fitKey, boardSize.width, boardSize.height]);

  // Magnetic release: the finger usually covers the target, so the nearest
  // node within SNAP_RADIUS wins rather than requiring a drop inside it.
  const handleConnectEnd = (x: number, y: number) => {
    setPending(null);
    if (!pending) return;
    let target: BoardNode | null = null;
    let best = SNAP_RADIUS;
    for (const node of nodes) {
      if (node.id === pending.fromId) continue;
      const distance = Math.hypot(node.x + NODE_W / 2 - x, node.y + NODE_H / 2 - y);
      if (distance < best) {
        best = distance;
        target = node;
      }
    }
    if (target) onAddEdge(pending.fromId, target.id);
  };

  // Tap-to-connect: tap a handle to arm, tap a node body to complete.
  const handleConnectTap = (id: string) => setConnectFrom((current) => (current === id ? null : id));

  const handleBodyTap = (id: string) => {
    if (!connectFrom) return;
    if (id !== connectFrom) onAddEdge(connectFrom, id);
    setConnectFrom(null);
  };

  // Taps arrive in screen coordinates; edges live in canvas coordinates.
  const handleBoardTap = (screenX: number, screenY: number) => {
    if (connectFrom) {
      setConnectFrom(null);
      return;
    }
    const px = (screenX - translateX.value) / scale.value;
    const py = (screenY - translateY.value) / scale.value;
    for (const edge of edges) {
      const a = nodeById[edge.from];
      const b = nodeById[edge.to];
      if (!a || !b) continue;
      if (distanceToEdge(edgeGeometry(a, b), px, py) <= EDGE_TAP_TOLERANCE) {
        onTapEdge(edge.id);
        return;
      }
    }
  };

  const boardTap = Gesture.Tap().onEnd((event) => {
    runOnJS(handleBoardTap)(event.x, event.y);
  });

  const boardGesture = Gesture.Race(boardTap, pinch, panBackground);

  const viewportStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const pendingGeometry = ((): EdgeGeometry | null => {
    if (!pending || pending.x === 0) return null;
    const source = nodeById[pending.fromId];
    if (!source) return null;
    const sx = source.x + NODE_W;
    const sy = source.y + NODE_H / 2;
    return { sx, sy, tx: pending.x, ty: pending.y, mx: (sx + pending.x) / 2 };
  })();

  return (
    <GestureDetector gesture={boardGesture}>
      <View
        onLayout={(event) => setBoardSize(event.nativeEvent.layout)}
        style={{
          flex: 1,
          backgroundColor: colors.bgDeep,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              width: CANVAS.width,
              height: CANVAS.height,
              transformOrigin: "top left",
            },
            viewportStyle,
          ]}
        >
          <Canvas style={{ position: "absolute", width: CANVAS.width, height: CANVAS.height }}>
            {edges.map((edge) => {
              const a = nodeById[edge.from];
              const b = nodeById[edge.to];
              if (!a || !b) return null;
              const geometry = edgeGeometry(a, b);
              return (
                <Group key={edge.id}>
                  {/* Async hops are dashed — "this one doesn't block" at a glance. */}
                  <Path path={bezierPath(geometry)} color={EDGE_COLOR} style="stroke" strokeWidth={2}>
                    {edge.mode === "async" && <DashPathEffect intervals={[6, 4]} />}
                  </Path>
                  <Path path={arrowheadPath(geometry)} color={EDGE_COLOR} />
                </Group>
              );
            })}
            {pendingGeometry && (
              <Path path={bezierPath(pendingGeometry)} color={colors.accent} style="stroke" strokeWidth={2}>
                <DashPathEffect intervals={[10, 8]} phase={dashPhase} />
              </Path>
            )}
          </Canvas>

          {nodes.map((node) => (
            <NodeView
              key={node.id}
              node={node}
              canvasSize={CANVAS}
              zoomScale={scale}
              isConnectSource={connectFrom === node.id}
              onMove={onMoveNode}
              onRemove={onRemoveNode}
              onConnectTap={handleConnectTap}
              onBodyTap={handleBodyTap}
              onInspect={onInspectNode}
              onConnectStart={(fromId) => setPending({ fromId, x: 0, y: 0 })}
              onConnectMove={(x, y) => setPending((current) => (current ? { ...current, x, y } : current))}
              onConnectEnd={handleConnectEnd}
            />
          ))}
        </Animated.View>

        {nodes.length === 0 && (
          <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.textFaint, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>
              Add components below, drag to arrange,{"\n"}tap a node's ● handle then a target to wire them up.
              {"\n"}Pinch to zoom · drag empty space to pan.
            </Text>
          </View>
        )}

        {connectFrom && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 10,
              alignSelf: "center",
              paddingHorizontal: 14,
              paddingVertical: 7,
              backgroundColor: `${colors.accent}30`,
              borderWidth: 1,
              borderColor: colors.accent,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: colors.textBright, fontSize: 12, fontWeight: "600" }}>
              Tap a target to connect — tap elsewhere to cancel
            </Text>
          </View>
        )}

        {/* Always-visible zoom controls: zoom is discoverable without knowing the gestures. */}
        <View
          style={{
            position: "absolute",
            right: 10,
            // Clears the floating palette bar docked at the canvas bottom.
            bottom: 66,
            flexDirection: "row",
            alignItems: "center",
            padding: 3,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
          }}
        >
          <ZoomButton label="−" accessibilityLabel={t("board.zoomOut")} onPress={() => zoomBy(1 / ZOOM_STEP)} />
          <Text style={{ minWidth: 44, textAlign: "center", color: colors.textDim, fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
            {zoomPercent}%
          </Text>
          <ZoomButton label="+" accessibilityLabel={t("board.zoomIn")} onPress={() => zoomBy(ZOOM_STEP)} />
          <TouchableOpacity
            onPress={fitAll}
            accessibilityRole="button"
            accessibilityHint={t("board.fitHint")}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <BrandIcon name="fit" color={colors.textDim} size={13} />
            <Text style={{ color: colors.textDim, fontSize: 12, fontWeight: "600" }}>{t("board.fit")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureDetector>
  );
}

function ZoomButton({ label, accessibilityLabel, onPress }: { label: string; accessibilityLabel: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={{ width: 32, height: 30, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: colors.textBright, fontSize: 18, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
  );
}

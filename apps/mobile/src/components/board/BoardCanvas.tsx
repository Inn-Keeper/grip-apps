import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
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
  withTiming,
} from "react-native-reanimated";
import { nodeSize, styleOf, type BoardEdge, type BoardNode } from "@grip/core/arch";
import { arrowheadPath, bezierPath, distanceToEdge, edgeGeometry as geometryFor, headPoints } from "@grip/core/edgeGeometry";

const NODE_SIZE = { width: NODE_W, height: NODE_H };
// Resized nodes (saved on web) keep their size, so arrows meet their real edges.
const sizeOf = (node: BoardNode) => nodeSize(node, NODE_SIZE);
const edgeGeometry = (a: BoardNode, b: BoardNode) => geometryFor(a, b, sizeOf(a), sizeOf(b));
// "x,y x,y x,y" from headPoints as a closed Skia path.
const trianglePath = (points: string) => `M ${points.split(" ").join(" L ").replace(/,/g, " ")} Z`;
type EdgeGeometry = ReturnType<typeof edgeGeometry>;
import { t } from "@grip/core/i18n";
import { colors, font } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { NODE_H, NODE_W, NodeView } from "./NodeView";
import type { Tool } from "./BoardTools";

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
// Fit and button zoom ease without overshoot: a spring bounced the view past its target.
const ZOOM_EASE = { duration: 220, easing: Easing.out(Easing.cubic) };

/** Lets the screen place new nodes where the user is currently looking. */
export type BoardCanvasHandle = { visibleArea: () => { x: number; y: number; width: number; height: number } };

type PendingEdge = { fromId: string; x: number; y: number };
type Points = { x: number; y: number; x2: number; y2: number };
type Rect = { x: number; y: number; w: number; h: number };
// Shorter than this is a tap, not an arrow.
const MIN_ARROW = 8;
const ARROW_HANDLE = 26;

/** Distance from a point to a straight segment: tapping a free arrow or line selects it. */
function distanceToSegment(p: Points, px: number, py: number) {
  const dx = p.x2 - p.x;
  const dy = p.y2 - p.y;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - p.x) * dx + (py - p.y) * dy) / length));
  return Math.hypot(p.x + t * dx - px, p.y + t * dy - py);
}
const pointsOf = (n: BoardNode): Points => ({ x: n.x, y: n.y, x2: n.x2 ?? n.x, y2: n.y2 ?? n.y });

type Props = {
  nodes: BoardNode[];
  edges: BoardEdge[];
  onMoveNode: (id: string, x: number, y: number) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (fromId: string, toId: string) => void;
  onTapEdge: (id: string) => void;
  onInspectNode: (id: string) => void;
  /** The armed tool: Text waits for a tap, Arrow and Line for a drag. */
  tool: Tool | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPlaceText: (x: number, y: number) => void;
  onDrawArrow: (points: Points) => void;
  onMoveArrow: (id: string, points: Points) => void;
  onResizeNode: (id: string, rect: Rect) => void;
  /** Changes when a different board or scenario is shown; the view re-fits to it. */
  fitKey: number;
  // Shown beside Fit; omitted while already in Zen (the overlay has the exit).
  onZen?: () => void;
  ref?: Ref<BoardCanvasHandle>;
};

export function BoardCanvas({ nodes, edges, onMoveNode, onRemoveNode, onAddEdge, onTapEdge, onInspectNode, tool, selectedId, onSelect, onPlaceText, onDrawArrow, onMoveArrow, onResizeNode, fitKey, onZen, ref }: Props) {
  const [draft, setDraft] = useState<Points | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [pending, setPending] = useState<PendingEdge | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  // Viewport: screen = canvas * scale + translate (origin top-left).
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pinchStart = useSharedValue({ s: 1, tx: 0, ty: 0, fx: 0, fy: 0 });
  const panStart = useSharedValue({ tx: 0, ty: 0 });
  // Where the last fit or button zoom is heading. Rapid taps build on that, not on the
  // half-finished animation, so each tap is exactly one step. Pinch and pan clear it.
  const viewTarget = useSharedValue<{ s: number; tx: number; ty: number } | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  useAnimatedReaction(
    () => Math.round(scale.value * 100),
    (percent, previous) => {
      if (percent !== previous) runOnJS(setZoomPercent)(percent);
    }
  );
  const baseScale = Math.max(MIN_BASE_SCALE, Math.min(1, boardSize.width / BASE_VISIBLE_WIDTH));

  useImperativeHandle(ref, () => ({
    // The board area on screen, in canvas units, minus the tool row at the bottom.
    visibleArea: () => ({
      x: Math.max(0, -translateX.value / scale.value),
      y: Math.max(0, -translateY.value / scale.value),
      width: boardSize.width / scale.value,
      height: Math.max(120, boardSize.height - BOTTOM_OVERLAY) / scale.value,
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
      viewTarget.value = null;
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
      viewTarget.value = null;
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

  const glideTo = (s: number, tx: number, ty: number) => {
    viewTarget.value = { s, tx, ty };
    scale.value = withTiming(s, ZOOM_EASE);
    translateX.value = withTiming(tx, ZOOM_EASE);
    translateY.value = withTiming(ty, ZOOM_EASE);
  };

  /** Frames every node in the viewport — the "see everything in one shot" button. Never zooms past the base scale. */
  const fitAll = () => {
    if (boardSize.width === 0) return;
    if (nodes.length === 0) {
      glideTo(baseScale, 0, 0);
      return;
    }
    const minX = Math.min(...nodes.map((n) => n.x)) - FIT_PADDING;
    const minY = Math.min(...nodes.map((n) => n.y)) - FIT_PADDING;
    const maxX = Math.max(...nodes.map((n) => n.x + sizeOf(n).width)) + FIT_PADDING;
    const maxY = Math.max(...nodes.map((n) => n.y + sizeOf(n).height)) + FIT_PADDING;
    const usableHeight = Math.max(120, boardSize.height - BOTTOM_OVERLAY);
    const fitScale = Math.max(
      MIN_SCALE,
      Math.min(boardSize.width / (maxX - minX), usableHeight / (maxY - minY), baseScale)
    );
    // Clamped like a pan: centring a node near the origin would pull the canvas edge into view.
    glideTo(
      fitScale,
      clampTranslate((boardSize.width - (maxX - minX) * fitScale) / 2 - minX * fitScale, boardSize.width, CANVAS.width, fitScale),
      clampTranslate((usableHeight - (maxY - minY) * fitScale) / 2 - minY * fitScale, boardSize.height, CANVAS.height, fitScale)
    );
  };

  /** Button zoom keeps the screen center fixed. */
  const zoomBy = (factor: number) => {
    const from = viewTarget.value ?? { s: scale.value, tx: translateX.value, ty: translateY.value };
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, from.s * factor));
    const ratio = next / from.s;
    const cx = boardSize.width / 2;
    const cy = boardSize.height / 2;
    glideTo(
      next,
      clampTranslate(cx - (cx - from.tx) * ratio, boardSize.width, CANVAS.width, next),
      clampTranslate(cy - (cy - from.ty) * ratio, boardSize.height, CANVAS.height, next)
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
      // Free text and free arrows take no graded arrows.
      if (node.id === pending.fromId || node.type === "text" || node.type === "arrow") continue;
      const { width, height } = sizeOf(node);
      const distance = Math.hypot(node.x + width / 2 - x, node.y + height / 2 - y);
      if (distance < best) {
        best = distance;
        target = node;
      }
    }
    if (target) onAddEdge(pending.fromId, target.id);
  };

  // Tap-to-connect: tap a handle to arm, tap a node body to complete.
  const handleConnectTap = (id: string) => setConnectFrom((current) => (current === id ? null : id));

  // A tap on a node selects it, unless it completes an armed connection.
  const handleBodyTap = (id: string) => {
    if (!connectFrom) {
      onSelect(id);
      return;
    }
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
    if (tool === "text") {
      onPlaceText(px, py);
      return;
    }
    const arrow = nodes.find((node) => node.type === "arrow" && distanceToSegment(pointsOf(node), px, py) <= EDGE_TAP_TOLERANCE);
    if (arrow) {
      onSelect(arrow.id);
      return;
    }
    for (const edge of edges) {
      const a = nodeById[edge.from];
      const b = nodeById[edge.to];
      if (!a || !b) continue;
      if (distanceToEdge(edgeGeometry(a, b), px, py) <= EDGE_TAP_TOLERANCE) {
        onTapEdge(edge.id);
        return;
      }
    }
    onSelect(null);
  };

  const boardTap = Gesture.Tap().onEnd((event) => {
    runOnJS(handleBoardTap)(event.x, event.y);
  });

  // Arrow and Line tools: a one-finger drag on the board draws instead of panning.
  const finishDraw = (points: Points) => {
    setDraft(null);
    if (Math.hypot(points.x2 - points.x, points.y2 - points.y) >= MIN_ARROW) onDrawArrow(points);
  };
  const drawPan = Gesture.Pan()
    .maxPointers(1)
    .minDistance(4)
    .onUpdate((event) => {
      const s = scale.value;
      const start = { x: (event.x - event.translationX - translateX.value) / s, y: (event.y - event.translationY - translateY.value) / s };
      runOnJS(setDraft)({ x: start.x, y: start.y, x2: (event.x - translateX.value) / s, y2: (event.y - translateY.value) / s });
    })
    .onEnd((event) => {
      const s = scale.value;
      const start = { x: (event.x - event.translationX - translateX.value) / s, y: (event.y - event.translationY - translateY.value) / s };
      runOnJS(finishDraw)({ x: start.x, y: start.y, x2: (event.x - translateX.value) / s, y2: (event.y - translateY.value) / s });
    });
  const drawing = tool === "arrow" || tool === "line";
  const boardGesture = Gesture.Race(boardTap, pinch, drawing ? drawPan : panBackground);

  // The selected free arrow gets three handles: each end reshapes it, the middle moves it.
  const selectedArrow = nodes.find((node) => node.id === selectedId && node.type === "arrow") ?? null;
  const arrowStart = useRef<Points | null>(null);
  const beginArrowDrag = () => { arrowStart.current = selectedArrow ? pointsOf(selectedArrow) : null; };
  const dragArrow = (part: "start" | "end" | "line", dx: number, dy: number) => {
    const p = arrowStart.current;
    if (!p || !selectedArrow) return;
    onMoveArrow(selectedArrow.id, part === "start" ? { ...p, x: p.x + dx, y: p.y + dy }
      : part === "end" ? { ...p, x2: p.x2 + dx, y2: p.y2 + dy }
      : { x: p.x + dx, y: p.y + dy, x2: p.x2 + dx, y2: p.y2 + dy });
  };
  const arrowHandle = (part: "start" | "end" | "line") => Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      runOnJS(beginArrowDrag)();
    })
    .onUpdate((event) => {
      runOnJS(dragArrow)(part, event.translationX / scale.value, event.translationY / scale.value);
    });

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
    const sx = source.x + sizeOf(source).width;
    const sy = source.y + sizeOf(source).height / 2;
    return { sx, sy, tx: pending.x, ty: pending.y, mx: (sx + pending.x) / 2, vertical: false };
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
          <Canvas style={{
              position: "absolute",
              width: CANVAS.width,
              height: CANVAS.height
            }}>
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
            {/* Free arrows and lines drawn on web: shown here, edited on web for now. */}
            {nodes.filter((node) => node.type === "arrow").map((node) => {
              const style = styleOf(node);
              const color = colors[style.color];
              const from = { x: node.x, y: node.y };
              const to = { x: node.x2 ?? node.x, y: node.y2 ?? node.y };
              return (
                <Group key={node.id}>
                  <Path path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} color={color} style="stroke" strokeWidth={2} strokeCap="round">
                    {style.dashed && <DashPathEffect intervals={[7, 5]} />}
                  </Path>
                  {style.heads !== "none" && <Path path={trianglePath(headPoints(from, to))} color={color} />}
                  {style.heads === "both" && <Path path={trianglePath(headPoints(to, from))} color={color} />}
                </Group>
              );
            })}
            {draft && (
              <Path path={`M ${draft.x} ${draft.y} L ${draft.x2} ${draft.y2}`} color={colors.accent} style="stroke" strokeWidth={2}>
                <DashPathEffect intervals={[6, 4]} />
              </Path>
            )}
            {selectedArrow && (
              <Path
                path={`M ${selectedArrow.x} ${selectedArrow.y} L ${selectedArrow.x2 ?? selectedArrow.x} ${selectedArrow.y2 ?? selectedArrow.y}`}
                color={`${colors.accent}59`}
                style="stroke"
                strokeWidth={8}
                strokeCap="round"
              />
            )}
            {pendingGeometry && (
              <Path path={bezierPath(pendingGeometry)} color={colors.accent} style="stroke" strokeWidth={2}>
                <DashPathEffect intervals={[10, 8]} phase={dashPhase} />
              </Path>
            )}
          </Canvas>

          {nodes.filter((node) => node.type !== "arrow").map((node) => (
            <NodeView
              key={node.id}
              node={node}
              canvasSize={CANVAS}
              zoomScale={scale}
              isConnectSource={connectFrom === node.id}
              selected={selectedId === node.id}
              onResize={onResizeNode}
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
          {selectedArrow && (["start", "line", "end"] as const).map((part) => {
            const p = pointsOf(selectedArrow);
            const at = part === "start" ? { x: p.x, y: p.y } : part === "end" ? { x: p.x2, y: p.y2 } : { x: (p.x + p.x2) / 2, y: (p.y + p.y2) / 2 };
            return (
              <GestureDetector key={part} gesture={arrowHandle(part)}>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={{
                    position: "absolute",
                    left: at.x - ARROW_HANDLE / 2,
                    top: at.y - ARROW_HANDLE / 2,
                    width: ARROW_HANDLE,
                    height: ARROW_HANDLE,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View style={{
                      width: part === "line" ? 14 : 12,
                      height: part === "line" ? 14 : 12,
                      borderRadius: 7,
                      borderWidth: 2,
                      borderColor: colors.accent,
                      backgroundColor: part === "line" ? colors.accent : colors.surface
                    }} />
                </View>
              </GestureDetector>
            );
          })}
        </Animated.View>

        {nodes.length === 0 && (
          <View pointerEvents="none" style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center"
            }}>
            <Text style={{
                color: colors.textFaint,
                fontSize: font.size.body,
                textAlign: "center",
                paddingHorizontal: 24
              }}>
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
              // Below the style bar when something is selected.
              top: selectedId ? 64 : 10,
              alignSelf: "center",
              paddingHorizontal: 14,
              paddingVertical: 7,
              backgroundColor: `${colors.accent}30`,
              borderWidth: 1,
              borderColor: colors.accent,
              borderRadius: 20,
            }}
          >
            <Text style={{
                color: colors.textBright,
                fontSize: font.size.small,
                fontWeight: "600"
              }}>
              Tap a target to connect, tap elsewhere to cancel
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
          <Text style={{
              minWidth: 44,
              textAlign: "center",
              color: colors.textDim,
              fontSize: font.size.small,
              fontWeight: "700",
              fontVariant: ["tabular-nums"]
            }}>
            {zoomPercent}%
          </Text>
          <ZoomButton label="+" accessibilityLabel={t("board.zoomIn")} onPress={() => zoomBy(ZOOM_STEP)} />
          <TouchableOpacity
            onPress={fitAll}
            accessibilityRole="button"
            accessibilityLabel={t("board.fit")}
            accessibilityHint={t("board.fitHint")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 6
            }}
          >
            <BrandIcon name="fit" color={colors.textDim} size={16} />
          </TouchableOpacity>
          {onZen && (
            <TouchableOpacity onPress={onZen} accessibilityRole="button" accessibilityLabel={t("board.zen")} style={{
                paddingHorizontal: 10,
                paddingVertical: 6
              }}>
              <BrandIcon name="zen" color={colors.textDim} size={16} />
            </TouchableOpacity>
          )}
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
      style={{
        width: 32,
        height: 30,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Text style={{
          color: colors.textBright,
          fontSize: font.size.titleLg,
          fontWeight: "600"
        }}>{label}</Text>
    </TouchableOpacity>
  );
}

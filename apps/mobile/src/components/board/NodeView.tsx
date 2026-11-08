import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Canvas, Oval, Path, RoundedRect } from "@shopify/react-native-skia";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { FILL_ALPHA, MIN_CARD, MIN_SHAPE, TEXT_FONT_TOKEN, TYPE_COLORS, nodeLabel, nodeSize, resizeRect, styleOf } from "@grip/core/arch";
import type { BoardNode } from "@grip/core/arch";
import { alpha, font, useTheme } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

export const NODE_W = 124;
export const NODE_H = 52;
const HANDLE_SIZE = 22;
const RESIZE_SIZE = 22;
const SIDES = ["top", "right", "bottom", "left"] as const;
const CORNERS = ["nw", "ne", "sw", "se"] as const;
type Rect = { x: number; y: number; w: number; h: number };
// Free text grows with its lines up to this width, then wraps.
const TEXT_MAX_W = 320;

type Props = {
  node: BoardNode;
  /** Virtual canvas bounds the node is clamped to (canvas coordinates). */
  canvasSize: { width: number; height: number };
  /** Current viewport zoom — finger translations are screen px and must be unscaled. */
  zoomScale: SharedValue<number>;
  /** Highlighted as the source while tap-to-connect is armed. */
  isConnectSource: boolean;
  /** Live position updates while dragging, so Skia edges follow. */
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  /** Tap on the ● handle: arm (or disarm) tap-to-connect from this node. */
  onConnectTap: (id: string) => void;
  /** Tap on the node body: completes a connection when one is armed. */
  onBodyTap: (id: string) => void;
  /** Selected: resize handles show and the style bar acts on it. */
  selected: boolean;
  /** Live resize from a corner handle (canvas units); the screen keeps it in the board. */
  onResize: (id: string, rect: Rect) => void;
  /** Long press on the node body: opens the inspector (the label editor for free nodes). */
  onInspect: (id: string) => void;
  onConnectStart: (id: string) => void;
  onConnectMove: (x: number, y: number) => void;
  onConnectEnd: (x: number, y: number) => void;
};

// A free shape's outline and fill, drawn in Skia so diamonds and ellipses get a real border, as on web.
function ShapeOutline({ shape, w, h, fill, stroke }: { shape: string; w: number; h: number; fill: string; stroke: string }) {
  const diamond = `M ${w / 2} 1 L ${w - 1} ${h / 2} L ${w / 2} ${h - 1} L 1 ${h / 2} Z`;
  return (
    <Canvas pointerEvents="none" style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: w,
        height: h
      }}>
      {shape === "ellipse" ? (
        <>
          <Oval x={1} y={1} width={w - 2} height={h - 2} color={fill} />
          <Oval x={1} y={1} width={w - 2} height={h - 2} color={stroke} style="stroke" strokeWidth={2} />
        </>
      ) : shape === "diamond" ? (
        <>
          <Path path={diamond} color={fill} />
          <Path path={diamond} color={stroke} style="stroke" strokeWidth={2} />
        </>
      ) : (
        <>
          <RoundedRect x={1} y={1} width={w - 2} height={h - 2} r={shape === "note" ? 4 : 10} color={fill} />
          <RoundedRect x={1} y={1} width={w - 2} height={h - 2} r={shape === "note" ? 4 : 10} color={stroke} style="stroke" strokeWidth={2} />
        </>
      )}
    </Canvas>
  );
}

export function NodeView({
  node,
  canvasSize,
  zoomScale,
  isConnectSource,
  selected,
  onResize,
  onMove,
  onRemove,
  onConnectTap,
  onBodyTap,
  onInspect,
  onConnectStart,
  onConnectMove,
  onConnectEnd,
}: Props) {
  const { colors } = useTheme();
  const isText = node.type === "text";
  const isShape = node.type === "box";
  const shape = node.shape ?? "rect";
  const note = isShape && shape === "note";
  const name = nodeLabel(node);
  const color = TYPE_COLORS[node.type] ?? colors.textDim;
  // Sizes, shapes and styles come from web; mobile draws them but does not edit them yet.
  const size = nodeSize(node, { width: NODE_W, height: NODE_H });
  const style = styleOf(node);
  const fill = style.fill === "none" ? colors.surface : `${colors[style.fill]}${FILL_ALPHA}`;
  const fontSize = font.size[TEXT_FONT_TOKEN[isText ? "text" : "card"][style.size] as keyof typeof font.size];

  const x = useSharedValue(node.x);
  const y = useSharedValue(node.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);
  const dragging = useSharedValue(false);

  // Keep shared values in sync when positions change outside a drag (reset, undo, a reused
  // id). Not during one: React's copy lags the finger and would pull the node back a frame.
  useEffect(() => {
    if (dragging.value) return;
    x.value = node.x;
    y.value = node.y;
  }, [node.x, node.y, x, y, dragging]);

  const drag = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      dragging.value = true;
      startX.value = x.value;
      startY.value = y.value;
      scale.value = withSpring(1.07, { damping: 14 });
    })
    .onUpdate((event) => {
      const s = zoomScale.value;
      x.value = Math.max(0, Math.min(canvasSize.width - size.width, startX.value + event.translationX / s));
      y.value = Math.max(0, Math.min(canvasSize.height - size.height, startY.value + event.translationY / s));
      runOnJS(onMove)(node.id, x.value, y.value);
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 14 });
    })
    .onFinalize(() => {
      dragging.value = false;
    });

  // Tap on the body completes an armed tap-to-connect; race with drag so a
  // still finger taps and a moving one drags.
  const bodyTap = Gesture.Tap().onEnd(() => {
    runOnJS(onBodyTap)(node.id);
  });
  // Holding still opens the inspector; drag needs 4px so the two never fight.
  const inspect = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(onInspect)(node.id);
    });
  const body = Gesture.Race(drag, bodyTap, inspect);

  // Handles ● on all four sides, as on web: a tap arms tap-to-connect; a pull draws the
  // dashed pending edge from that side, and release snaps to the nearest node.
  const sideOrigin = (side: (typeof SIDES)[number]) => ({
    x: node.x + (side === "left" ? 0 : side === "right" ? size.width : size.width / 2),
    y: node.y + (side === "top" ? 0 : side === "bottom" ? size.height : size.height / 2),
  });
  const connectFor = (side: (typeof SIDES)[number]) => {
    const origin = sideOrigin(side);
    const handleTap = Gesture.Tap().onEnd(() => {
      runOnJS(onConnectTap)(node.id);
    });
    const connectPan = Gesture.Pan()
      .minDistance(6)
      .onStart(() => {
        runOnJS(onConnectStart)(node.id);
      })
      .onUpdate((event) => {
        const s = zoomScale.value;
        runOnJS(onConnectMove)(origin.x + event.translationX / s, origin.y + event.translationY / s);
      })
      .onEnd((event) => {
        const s = zoomScale.value;
        runOnJS(onConnectEnd)(origin.x + event.translationX / s, origin.y + event.translationY / s);
      });
    return Gesture.Race(connectPan, handleTap);
  };

  // Corner handles on the selected node resize it; the arithmetic is core's, shared with web.
  const resizeStart = useRef<Rect | null>(null);
  const beginResize = () => { resizeStart.current = { x: node.x, y: node.y, w: size.width, h: size.height }; };
  const resizeBy = (dir: string, dx: number, dy: number) => {
    if (resizeStart.current) onResize(node.id, resizeRect(resizeStart.current, dir, dx, dy, isShape ? MIN_SHAPE : MIN_CARD));
  };
  const resizeFor = (dir: (typeof CORNERS)[number]) => Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      runOnJS(beginResize)();
    })
    .onUpdate((event) => {
      const s = zoomScale.value;
      runOnJS(resizeBy)(dir, event.translationX / s, event.translationY / s);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    shadowOpacity: scale.value > 1 ? 0.5 : 0.15,
  }));

  // Diamonds and ellipses keep their text inside the curve; a note writes from its top left.
  const padding = note ? 12 : isShape && shape !== "rect" ? Math.round(size.width * 0.18) : 8;

  return (
    <GestureDetector gesture={body}>
      {/* Not `accessible` itself: that would swallow the remove and connect buttons on iOS. */}
      <Animated.View
        style={[
          {
            position: "absolute",
            // Free text sizes to its lines, as on web; shapes and components take their saved size.
            width: isText ? undefined : size.width,
            maxWidth: isText ? TEXT_MAX_W : undefined,
            height: isText ? undefined : size.height,
            minHeight: isText ? undefined : NODE_H,
            backgroundColor: isText || isShape ? "transparent" : fill,
            // Components keep the type colour on the border (node identity); shapes draw their own outline.
            borderWidth: isText || isShape ? 0 : 2,
            borderColor: isConnectSource ? colors.textBright : selected ? colors.accent : alpha(color, 0.38),
            borderRadius: 10,
            justifyContent: note ? "flex-start" : "center",
            paddingHorizontal: padding,
            paddingVertical: note ? 12 : 4,
            // The type-colour glow is node identity (DESIGN.md); shapes draw flat.
            shadowColor: isShape ? "transparent" : color,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: isText ? 0 : 4,
          },
          animatedStyle,
        ]}
      >
        {isShape && (
          <ShapeOutline
            shape={shape}
            w={size.width}
            h={size.height}
            fill={fill}
            stroke={isConnectSource ? colors.textBright : selected ? colors.accent : alpha(colors.textDim, 0.6)}
          />
        )}
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Board node ${name}`}
        >
          {/* A free node shows only what was typed (an empty box stays empty); a component shows its name. */}
          <Text style={{
              textAlign: style.align,
              fontSize,
              fontWeight: style.bold ? "700" : isText ? "400" : "600",
              color: colors[style.color],
              lineHeight: Math.round(fontSize * 1.3)
            }}>
            {isText || isShape ? node.label : name}
          </Text>
        </View>

        {!selected && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name}`}
          onPress={() => onRemove(node.id)}
          hitSlop={8}
          // Inside the node's bounds: iOS drops touches on children that overflow their parent.
          style={{
            position: "absolute",
            top: 3,
            right: 3,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BrandIcon name="close" color={colors.textDim} size={10} />
        </TouchableOpacity>
        )}

        {!isText && SIDES.map((side) => (
          <GestureDetector key={side} gesture={connectFor(side)}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Connect from ${name}`}
              hitSlop={12}
              style={{
                position: "absolute",
                // Overlaps the edge but keeps its center inside, so the tap lands (see above).
                ...(side === "left" || side === "right"
                  ? { [side]: -HANDLE_SIZE / 4, top: size.height / 2 - HANDLE_SIZE / 2 }
                  : { [side]: -HANDLE_SIZE / 4, left: size.width / 2 - HANDLE_SIZE / 2 }),
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: HANDLE_SIZE / 2,
                backgroundColor: isConnectSource ? colors.textBright : isShape ? colors.textDim : color,
                borderWidth: 3,
                borderColor: isConnectSource ? color : colors.bg,
              }}
            />
          </GestureDetector>
        ))}

        {selected && !isText && CORNERS.map((dir) => (
          <GestureDetector key={dir} gesture={resizeFor(dir)}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                position: "absolute",
                [dir.includes("n") ? "top" : "bottom"]: -RESIZE_SIZE / 4,
                [dir.includes("w") ? "left" : "right"]: -RESIZE_SIZE / 4,
                width: RESIZE_SIZE,
                height: RESIZE_SIZE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  borderWidth: 2,
                  borderColor: colors.accent,
                  backgroundColor: colors.surface
                }} />
            </View>
          </GestureDetector>
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

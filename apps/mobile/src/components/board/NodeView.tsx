import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { TYPE_COLORS, meta } from "@grip/core/arch";
import type { BoardNode } from "@grip/core/arch";
import { colors } from "@/theme";
import { BrandIcon, nodeIconName } from "@/components/BrandIcon";

export const NODE_W = 124;
export const NODE_H = 52;
const HANDLE_SIZE = 22;

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
  /** Long press on the node body: opens the sharding & replication inspector. */
  onInspect: (id: string) => void;
  onConnectStart: (id: string) => void;
  onConnectMove: (x: number, y: number) => void;
  onConnectEnd: (x: number, y: number) => void;
};

export function NodeView({
  node,
  canvasSize,
  zoomScale,
  isConnectSource,
  onMove,
  onRemove,
  onConnectTap,
  onBodyTap,
  onInspect,
  onConnectStart,
  onConnectMove,
  onConnectEnd,
}: Props) {
  const spec = meta(node.type);
  const color = TYPE_COLORS[node.type];

  const x = useSharedValue(node.x);
  const y = useSharedValue(node.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Keep shared values in sync when positions change outside a drag
  // (e.g. board reset or scenario switch reusing node ids).
  useEffect(() => {
    x.value = node.x;
    y.value = node.y;
  }, [node.x, node.y, x, y]);

  const drag = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
      scale.value = withSpring(1.07, { damping: 14 });
    })
    .onUpdate((event) => {
      const s = zoomScale.value;
      x.value = Math.max(0, Math.min(canvasSize.width - NODE_W, startX.value + event.translationX / s));
      y.value = Math.max(0, Math.min(canvasSize.height - NODE_H, startY.value + event.translationY / s));
      runOnJS(onMove)(node.id, x.value, y.value);
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 14 });
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

  // Handle ●: a tap arms tap-to-connect; a pull draws the dashed pending
  // edge, and release snaps to the nearest node.
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
      runOnJS(onConnectMove)(node.x + NODE_W + event.translationX / s, node.y + NODE_H / 2 + event.translationY / s);
    })
    .onEnd((event) => {
      const s = zoomScale.value;
      runOnJS(onConnectEnd)(node.x + NODE_W + event.translationX / s, node.y + NODE_H / 2 + event.translationY / s);
    });
  const connect = Gesture.Race(connectPan, handleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    shadowOpacity: scale.value > 1 ? 0.5 : 0.15,
  }));

  return (
    <GestureDetector gesture={body}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Board node ${spec.label}`}
        style={[
          {
            position: "absolute",
            width: NODE_W,
            height: NODE_H,
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: isConnectSource ? colors.textBright : `${color}60`,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 8,
            shadowColor: color,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          },
          animatedStyle,
        ]}
      >
        <BrandIcon name={nodeIconName(node.type)} color={color} size={18} />
        <Text style={{ flex: 1, fontSize: 10, fontWeight: "600", color: colors.text, lineHeight: 13 }}>
          {spec.label}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Remove ${spec.label}`}
          onPress={() => onRemove(node.id)}
          hitSlop={8}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
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

        <GestureDetector gesture={connect}>
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Connect from ${spec.label}`}
            hitSlop={14}
            style={{
              position: "absolute",
              right: -HANDLE_SIZE / 2,
              top: NODE_H / 2 - HANDLE_SIZE / 2 - 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: HANDLE_SIZE / 2,
              backgroundColor: isConnectSource ? colors.textBright : color,
              borderWidth: 3,
              borderColor: isConnectSource ? color : colors.bg,
            }}
          />
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
}

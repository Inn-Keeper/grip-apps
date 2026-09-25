import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Canvas, Circle } from "@shopify/react-native-skia";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { colors, font } from "@/theme";

type Props = {
  title: string;
  subtitle: string;
  accent?: string;
  onDone: () => void;
};

// Decorative confetti ramp — centralized in core tokens (deco1–6) — see DESIGN.md.
const PARTICLE_COLORS = [colors.deco1, colors.deco2, colors.deco3, colors.deco4, colors.deco5, colors.deco6];
const PARTICLES = Array.from({ length: 54 }, (_, index) => ({
  angle: (Math.PI * 2 * index) / 54 + (index % 5) * 0.08,
  distance: 72 + (index % 9) * 17,
  size: 2.5 + (index % 4),
  delay: (index % 6) * 0.045,
  color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
}));

const BURST_MS = 1250;
const DISMISS_MS = 2100;

const easeOutCubic = (value: number) => {
  "worklet";
  return 1 - Math.pow(1 - value, 3);
};

type ParticleProps = {
  progress: SharedValue<number>;
  center: { x: number; y: number };
  angle: number;
  distance: number;
  size: number;
  delay: number;
  color: string;
};

/** One confetti dot: position and radius derive from the shared burst progress on the UI thread. */
function Particle({ progress, center, angle, distance, size, delay, color }: ParticleProps) {
  const local = useDerivedValue(() =>
    Math.max(0, Math.min(1, (progress.value - delay) / (1 - delay)))
  );
  const cx = useDerivedValue(() => center.x + Math.cos(angle) * distance * easeOutCubic(local.value));
  const cy = useDerivedValue(
    () => center.y + Math.sin(angle) * distance * easeOutCubic(local.value) + local.value * 42
  );
  const r = useDerivedValue(() =>
    local.value <= 0 || local.value >= 1 ? 0 : size * (1 - local.value * 0.35)
  );
  return <Circle cx={cx} cy={cy} r={r} color={color} />;
}

export function CelebrationOverlay({ title, subtitle, accent = colors.accent, onDone }: Props) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: BURST_MS, easing: Easing.linear });
    const done = setTimeout(onDone, DISMISS_MS);
    return () => clearTimeout(done);
  }, [onDone, progress]);

  const center = { x: layout.width / 2, y: layout.height / 2 - 24 };

  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(180)}
      onLayout={(event) => setLayout(event.nativeEvent.layout)}
      style={styles.root}
    >
      {layout.width > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          {PARTICLES.map((particle, index) => (
            <Particle key={String(index)} progress={progress} center={center} {...particle} />
          ))}
        </Canvas>
      )}

      <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.badge, { borderColor: `${accent}90` }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.bg}a8`,
    zIndex: 20,
  },
  badge: {
    minWidth: 240,
    maxWidth: 320,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: `${colors.surface}f2`,
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: colors.textBright,
    fontSize: font.size.headingLg,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textDim,
    fontSize: font.size.body,
    lineHeight: 18,
    textAlign: "center",
  },
});

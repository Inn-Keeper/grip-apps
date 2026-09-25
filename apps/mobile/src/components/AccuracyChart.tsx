import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Canvas, Circle, Path } from "@shopify/react-native-skia";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@/theme";

type Point = { date: string; accuracy: number; total: number };

type Props = { points: Point[] };

const HEIGHT = 82;
const PAD_X = 12;
const PAD_Y = 14;

export function AccuracyChart({ points }: Props) {
  const [width, setWidth] = useState(0);
  const latest = points.at(-1);
  const chart = useMemo(() => {
    if (width <= 0 || points.length === 0) return { path: "", dots: [] as { x: number; y: number; key: string }[] };
    const innerW = Math.max(1, width - PAD_X * 2);
    const innerH = HEIGHT - PAD_Y * 2;
    const maxIndex = Math.max(1, points.length - 1);
    const dots = points.map((point, index) => ({
      key: point.date,
      x: PAD_X + (index / maxIndex) * innerW,
      y: PAD_Y + (1 - point.accuracy) * innerH,
    }));
    const path = dots.map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`).join(" ");
    return { path, dots };
  }, [points, width]);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSoft, boxShadow: shadow.card,
        borderRadius: 12,
        padding: 12,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: font.size.small, fontWeight: "700", color: colors.textBright }}>{t("accuracy.title")}</Text>
          <Text style={{ fontSize: font.size.captionLg, color: colors.textFaint }}>{t("accuracy.subtitle")}</Text>
        </View>
        <Text style={{ fontSize: font.size.body, fontWeight: "800", color: latest && latest.accuracy >= 0.7 ? colors.success : colors.warning }}>
          {latest ? `${Math.round(latest.accuracy * 100)}%` : "--"}
        </Text>
      </View>

      {points.length < 2 ? (
        <View style={{ height: HEIGHT, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.textFaint, fontSize: font.size.label }}>{t("accuracy.empty")}</Text>
        </View>
      ) : (
        <Canvas style={{ width: "100%", height: HEIGHT }}>
          <Path path={`M ${PAD_X} ${PAD_Y} L ${PAD_X} ${HEIGHT - PAD_Y} L ${Math.max(PAD_X, width - PAD_X)} ${HEIGHT - PAD_Y}`} color={colors.border} style="stroke" strokeWidth={1} />
          <Path path={chart.path} color={colors.accent} style="stroke" strokeWidth={3} />
          {chart.dots.map((dot, index) => (
            <Circle key={dot.key} cx={dot.x} cy={dot.y} r={index === chart.dots.length - 1 ? 4 : 2.5} color={index === chart.dots.length - 1 ? colors.success : colors.accent} />
          ))}
        </Canvas>
      )}
    </View>
  );
}

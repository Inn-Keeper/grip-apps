import { View } from "react-native";

type DifficultyTier = { key: string; color: string };

type Props = {
  tier: DifficultyTier | null | undefined;
  size?: number;
};

export function DifficultyIcon({ tier, size = 18 }: Props) {
  if (!tier) return null;
  const color = tier.color;
  const scale = size / 18;

  if (tier.key === "easy") {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <View style={{
            width: 12 * scale,
            height: 4 * scale,
            borderRadius: 2 * scale,
            backgroundColor: color
          }} />
      </View>
    );
  }

  if (tier.key === "mid") {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          width: size,
          height: size,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 1.4 * scale
        }}
      >
        <View style={{
            width: 4 * scale,
            height: 5 * scale,
            borderRadius: 1.2 * scale,
            backgroundColor: color,
            opacity: 0.55
          }} />
        <View style={{
            width: 4 * scale,
            height: 8.5 * scale,
            borderRadius: 1.2 * scale,
            backgroundColor: color,
            opacity: 0.78
          }} />
        <View style={{
            width: 4 * scale,
            height: 13 * scale,
            borderRadius: 1.2 * scale,
            backgroundColor: color
          }} />
      </View>
    );
  }

  if (tier.key === "high") {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <View
          style={{
            width: 10 * scale,
            height: 14 * scale,
            borderTopLeftRadius: 9 * scale,
            borderTopRightRadius: 2 * scale,
            borderBottomLeftRadius: 8 * scale,
            borderBottomRightRadius: 8 * scale,
            backgroundColor: color,
            transform: [{ rotate: "18deg" }],
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 2.5 * scale,
            width: 5 * scale,
            height: 7 * scale,
            borderTopLeftRadius: 5 * scale,
            borderTopRightRadius: 1 * scale,
            borderBottomLeftRadius: 4 * scale,
            borderBottomRightRadius: 4 * scale,
            backgroundColor: "rgba(255,255,255,0.28)",
            transform: [{ rotate: "14deg" }],
          }}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <View
        style={{
          width: 12 * scale,
          height: 12 * scale,
          borderWidth: Math.max(1, 1.5 * scale),
          borderColor: color,
          backgroundColor: `${color}22`,
          transform: [{ rotate: "45deg" }],
        }}
      />
      <View style={{
          position: "absolute",
          width: 9 * scale,
          height: 1.5 * scale,
          borderRadius: scale,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }]
        }} />
      <View style={{
          position: "absolute",
          width: 9 * scale,
          height: 1.5 * scale,
          borderRadius: scale,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }]
        }} />
    </View>
  );
}

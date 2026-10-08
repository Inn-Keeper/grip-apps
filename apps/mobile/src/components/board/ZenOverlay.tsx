import { Text, TouchableOpacity, View } from "react-native";
import { t } from "@grip/core/i18n";
import { colors, font } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

type Props = { label: string; onExit: () => void };

// Zen mode: a translucent title over the canvas and a button back to compact.
export function ZenOverlay({ label, onExit }: Props) {
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: `${colors.bgDeep}b8`,
          borderRadius: 16,
        }}
      >
        <Text numberOfLines={1} style={{
            fontSize: font.size.small,
            fontWeight: "600",
            color: colors.textDim
          }}>
          {label}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onExit}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("board.exitZen")}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: `${colors.bgDeep}b8`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BrandIcon name="close" color={colors.textDim} size={14} />
      </TouchableOpacity>
    </>
  );
}

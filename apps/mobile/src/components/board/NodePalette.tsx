import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NODE_TYPES, TYPE_COLORS, meta } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, shadow } from "@/theme";
import { BrandIcon, nodeIconName } from "@/components/BrandIcon";

type DescKey = Parameters<typeof t>[0];

// The component strip over the board. Tap adds a node; long press explains it.
export function NodePalette({ onAddNode }: { onAddNode: (type: string) => void }) {
  const [tipType, setTipType] = useState<string | null>(null);
  // Floating: the canvas extends underneath, so this row costs no layout height;
  // translucent so the board reads through it.
  return (
    <View
      style={{
        position: "absolute",
        bottom: 8,
        left: 8,
        right: 8,
        backgroundColor: `${colors.bgDeep}d9`,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
      }}
    >
      {/* Long press shows what a node is; releasing hides it (the web shows this on hover). */}
      {tipType && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: 6,
            padding: 10,
            backgroundColor: colors.bgDeep,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            borderRadius: 8,
            boxShadow: shadow.card,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{meta(tipType).label}</Text>
          <Text style={{ fontSize: 12, color: colors.text, marginTop: 2, lineHeight: 17 }}>
            {t(`node.desc.${tipType}` as DescKey)}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>
            {t("node.costMaint", { cost: meta(tipType).cost, maint: meta(tipType).maint })}
          </Text>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, padding: 6 }}
      >
        {NODE_TYPES.map((spec) => (
          <TouchableOpacity
            key={spec.type}
            onPress={() => onAddNode(spec.type)}
            onLongPress={() => setTipType(spec.type)}
            onPressOut={() => setTipType(null)}
            accessibilityHint={t(`node.desc.${spec.type}` as DescKey)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 7,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: `${TYPE_COLORS[spec.type]}40`,
              borderRadius: 8,
            }}
          >
            <BrandIcon
              name={nodeIconName(spec.type)}
              color={TYPE_COLORS[spec.type]}
              size={16}
            />
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text }}>{spec.label}</Text>
            <Text style={{ fontSize: 9, color: colors.textFaint }}>{"$".repeat(spec.cost) || "free"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

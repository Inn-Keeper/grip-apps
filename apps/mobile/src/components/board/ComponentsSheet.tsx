import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NODE_TYPES, TYPE_COLORS } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { alpha, font, useTheme } from "@/theme";
import { BrandIcon, nodeIconName } from "@/components/BrandIcon";

type Props = { visible: boolean; onAdd: (type: string) => void; onClose: () => void };

// The built-in components, one tap away from the tool row (web's Components dropdown).
// Picking one adds it and closes the sheet.
export function ComponentsSheet({ visible, onAdd, onClose }: Props) {
  const { colors, tints } = useTheme();
  if (!visible) return null;
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} accessibilityLabel={t("common.close")} style={{
          flex: 1,
          backgroundColor: tints.modalScrim
        }} />
      <View style={{
          maxHeight: "70%",
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          padding: 16,
          gap: 10
        }}>
        <Text accessibilityRole="header" style={{
            fontSize: font.size.bodyLg,
            fontWeight: "700",
            color: colors.textBright
          }}>{t("board.components")}</Text>
        <ScrollView contentContainerStyle={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            paddingBottom: 24
          }}>
          {NODE_TYPES.map((spec) => (
            <TouchableOpacity
              key={spec.type}
              accessibilityRole="button"
              accessibilityLabel={spec.label}
              accessibilityHint={t(`node.desc.${spec.type}` as Parameters<typeof t>[0])}
              onPress={() => { onAdd(spec.type); onClose(); }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 40,
                paddingHorizontal: 10,
                backgroundColor: colors.bgDeep,
                borderWidth: 1,
                borderColor: alpha(TYPE_COLORS[spec.type] ?? colors.textDim, 0.25),
                borderRadius: 8
              }}
            >
              <BrandIcon name={nodeIconName(spec.type)} color={TYPE_COLORS[spec.type] ?? colors.textDim} size={16} />
              <Text style={{
                  fontSize: font.size.small,
                  fontWeight: "600",
                  color: colors.text
                }}>{spec.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

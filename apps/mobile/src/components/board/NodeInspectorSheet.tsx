import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { TYPE_COLORS, isFreeType, nodeLabel } from "@grip/core/arch";
import type { BoardNode } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { font, useTheme } from "@/theme";
import { BrandIcon, nodeIconName } from "@/components/BrandIcon";
import { Button, MiniButton } from "@/components/ui";

/** Replica counts an interviewer would recognise; beyond 5 the number stops mattering. */
const REPLICA_CHOICES = [1, 2, 3, 5];

type Props = {
  node: BoardNode | null;
  onChange: (patch: Partial<BoardNode>) => void;
  onClose: () => void;
  onRemove: () => void;
};

export function NodeInspectorSheet({ node, onChange, onClose, onRemove }: Props) {
  const { colors, tints } = useTheme();
  if (!node) return null;
  const free = isFreeType(node.type);
  const color = TYPE_COLORS[node.type] ?? colors.textDim;
  const inputStyle = {
    padding: 10,
    backgroundColor: colors.bgDeep,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    fontSize: font.size.body,
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{
          flex: 1,
          backgroundColor: tints.modalScrim
        }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderColor: colors.borderSoft,
            padding: 20,
            gap: 14,
          }}
        >
          <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8
            }}>
            <BrandIcon name={nodeIconName(node.type)} color={color} size={16} />
            <Text style={{
                fontSize: font.size.bodyLg,
                fontWeight: "700",
                color: colors.textBright,
                flex: 1
              }}>{nodeLabel(node)}</Text>
          </View>

          {/* Free box and text: the label is all there is to edit. */}
          {free ? (
            <TextInput
              value={node.label ?? ""}
              onChangeText={(value) => onChange({ label: value })}
              placeholder={t(node.type === "text" ? "board.textPlaceholder" : "board.boxPlaceholder")}
              placeholderTextColor={colors.textFaint}
              autoFocus={node.label === undefined}
              multiline={node.type === "text"}
              style={inputStyle}
            />
          ) : (
          <>

          <View style={{ gap: 5 }}>
            <Text style={{
                fontSize: font.size.label,
                fontWeight: "700",
                color: colors.textDim
              }}>{t("node.partitionKey")}</Text>
            <TextInput
              value={node.partitionKey ?? ""}
              onChangeText={(value) => onChange({ partitionKey: value })}
              placeholder={t("node.partitionKeyPlaceholder")}
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              style={inputStyle}
            />
          </View>

          <View style={{ gap: 5 }}>
            <Text style={{
                fontSize: font.size.label,
                fontWeight: "700",
                color: colors.textDim
              }}>{t("node.replicas")}</Text>
            <View style={{
                flexDirection: "row",
                gap: 8
              }}>
              {REPLICA_CHOICES.map((count) => (
                <MiniButton
                  key={count}
                  label={String(count)}
                  color={node.replicas === count ? colors.accent : colors.textDim}
                  onPress={() => onChange({ replicas: node.replicas === count ? undefined : count })}
                />
              ))}
            </View>
          </View>
          </>
          )}

          {/* Removing from here always works; the node's own ✕ gets tiny when zoomed out. */}
          <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }}>
            <MiniButton label={t("board.remove")} color={colors.danger} onPress={onRemove} />
            <Button label={t("common.close")} onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

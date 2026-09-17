import { Modal, Pressable, Text, View } from "react-native";
import { EDGE_MODES, EDGE_PROTOCOLS, meta } from "@grip/core/arch";
import type { BoardEdge, BoardNode } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, tints } from "@/theme";
import { Button, MiniButton } from "@/components/ui";

type Props = {
  edge: BoardEdge | null;
  from: BoardNode | undefined;
  to: BoardNode | undefined;
  onChange: (patch: Partial<BoardEdge>) => void;
  onRemove: () => void;
  onClose: () => void;
};

export function EdgeInspectorSheet({ edge, from, to, onChange, onRemove, onClose }: Props) {
  if (!edge) return null;

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: tints.modalScrim }} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 20,
          gap: 14,
        }}
      >
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textDim }}>{t("edge.title")}</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textBright }}>
            {from ? meta(from.type).label : "?"} → {to ? meta(to.type).label : "?"}
          </Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textDim }}>{t("edge.mode")}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {EDGE_MODES.map((mode: string) => (
              <MiniButton
                key={mode}
                label={mode === "sync" ? t("edge.sync") : t("edge.async")}
                color={edge.mode === mode ? colors.accent : colors.textDim}
                onPress={() => onChange({ mode: edge.mode === mode ? undefined : (mode as BoardEdge["mode"]) })}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textDim }}>{t("edge.protocol")}</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {EDGE_PROTOCOLS.map((protocol: string) => (
              <MiniButton
                key={protocol}
                label={protocol}
                color={edge.protocol === protocol ? colors.accent : colors.textDim}
                onPress={() => onChange({ protocol: edge.protocol === protocol ? undefined : protocol })}
              />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
          <MiniButton label={t("board.removeConnection")} color={colors.danger} onPress={onRemove} />
          <Button label={t("common.close")} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

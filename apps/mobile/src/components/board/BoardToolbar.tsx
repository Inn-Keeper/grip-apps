import { Text, TouchableOpacity, View } from "react-native";
import { t } from "@grip/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font, radius } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";
import { Button, MiniButton } from "@/components/ui";

export type Chrome = "full" | "compact" | "zen";

type Props = {
  chrome: Chrome;
  onChrome: (next: Chrome) => void;
  scenarioName: string;
  talkAnswered: number;
  talkOpen: boolean;
  savedOpen: boolean;
  saving: boolean;
  canEvaluate: boolean;
  onOpenTalk: () => void;
  onToggleSaved: () => void;
  onSave: () => void;
  onClear: () => void;
  onEvaluate: () => void;
  history: { canUndo: boolean; canRedo: boolean; undo: () => void; redo: () => void };
};

// The board's action row: chrome toggles and the board actions.
export function BoardToolbar({
  chrome, onChrome, scenarioName, talkAnswered, talkOpen, savedOpen,
  saving, canEvaluate, onOpenTalk, onToggleSaved, onSave, onClear, onEvaluate, history,
}: Props) {
  return (
    // Wraps onto a second line on narrow screens so every action stays reachable.
    <View style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 10,
        rowGap: 6
      }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={chrome === "full" ? t("board.chromeHide") : t("board.chromeShow")}
        onPress={() => onChrome(chrome === "full" ? "compact" : "full")}
        hitSlop={6}
        style={{
          padding: 6,
          borderWidth: 1,
          borderColor: `${colors.textDim}50`,
          borderRadius: radius.sm
        }}
      >
        <BrandIcon name={chrome === "full" ? "arrowUp" : "arrowDown"} color={colors.textDim} size={16} />
      </TouchableOpacity>
      <HistoryButton icon="undo" label={t("board.undo")} enabled={history.canUndo} onPress={history.undo} />
      <HistoryButton icon="redo" label={t("board.redo")} enabled={history.canRedo} onPress={history.redo} />
      {chrome === "compact" && (
        <Text numberOfLines={1} style={{
            fontSize: font.size.small,
            fontWeight: "600",
            color: colors.textDim,
            flexShrink: 1
          }}>
          {scenarioName}
        </Text>
      )}
      <View style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginLeft: "auto",
          alignItems: "center"
        }}>
        <MiniButton
          label={`${t("talk.title")} ${talkAnswered}/${TALK_TRACK_SECTIONS.length}`}
          color={talkOpen ? colors.accent : colors.textDim}
          onPress={onOpenTalk}
        />
        <MiniButton label={t("board.saved")} color={savedOpen ? colors.accent : colors.textDim} onPress={onToggleSaved} />
        <MiniButton
          label={saving ? t("common.saving") : t("common.save")}
          color={colors.success}
          onPress={onSave}
        />
        <MiniButton label={t("common.clear")} color={colors.textDim} onPress={onClear} />
        <Button label={t("board.evaluate")} onPress={onEvaluate} disabled={!canEvaluate} />
      </View>
    </View>
  );
}

// Same bordered icon button as the Show arrow.
function HistoryButton({ icon, label, enabled, onPress }: { icon: "undo" | "redo"; label: string; enabled: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      hitSlop={6}
      style={{
        padding: 6,
        borderWidth: 1,
        borderColor: `${colors.textDim}50`,
        borderRadius: radius.sm,
        opacity: enabled ? 1 : 0.4
      }}
    >
      <BrandIcon name={icon} color={colors.textDim} size={16} />
    </TouchableOpacity>
  );
}

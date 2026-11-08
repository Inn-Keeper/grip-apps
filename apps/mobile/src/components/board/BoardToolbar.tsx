import { Text, TouchableOpacity, View } from "react-native";
import { t } from "@grip/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { alpha, colors, font, radius } from "@/theme";
import { BrandIcon, type BrandIconName } from "@/components/BrandIcon";

export type Chrome = "full" | "compact" | "zen";

type Props = {
  chrome: Chrome;
  onChrome: (next: Chrome) => void;
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

// The board's action row, one line of icon buttons: chrome and history left, board actions right.
export function BoardToolbar({
  chrome, onChrome, talkAnswered, talkOpen, savedOpen,
  saving, canEvaluate, onOpenTalk, onToggleSaved, onSave, onClear, onEvaluate, history,
}: Props) {
  return (
    <View style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6
      }}>
      <IconButton
        icon={chrome === "full" ? "arrowUp" : "arrowDown"}
        label={chrome === "full" ? t("board.chromeHide") : t("board.chromeShow")}
        onPress={() => onChrome(chrome === "full" ? "compact" : "full")}
      />
      <IconButton icon="undo" label={t("board.undo")} enabled={history.canUndo} onPress={history.undo} />
      <IconButton icon="redo" label={t("board.redo")} enabled={history.canRedo} onPress={history.redo} />
      <View style={{ flex: 1 }} />
      <IconButton
        icon="prompt"
        label={`${t("talk.title")} ${talkAnswered}/${TALK_TRACK_SECTIONS.length}`}
        tint={talkOpen ? colors.accent : undefined}
        onPress={onOpenTalk}
        badge={`${talkAnswered}/${TALK_TRACK_SECTIONS.length}`}
      />
      <IconButton icon="saved" label={t("board.saved")} tint={savedOpen ? colors.accent : undefined} onPress={onToggleSaved} />
      <IconButton icon="check" label={saving ? t("common.saving") : t("common.save")} tint={colors.success} enabled={!saving} onPress={onSave} />
      <IconButton icon="trash" label={t("common.clear")} onPress={onClear} />
      <IconButton icon="evaluate" label={t("board.evaluate")} filled enabled={canEvaluate} onPress={onEvaluate} />
    </View>
  );
}

type IconButtonProps = {
  icon: BrandIconName;
  label: string;
  onPress: () => void;
  enabled?: boolean;
  tint?: string;
  // The primary action: accent fill, as the Button it replaces.
  filled?: boolean;
  badge?: string;
};

// Bordered icon button; the label is for screen readers.
function IconButton({ icon, label, onPress, enabled = true, tint, filled, badge }: IconButtonProps) {
  const color = filled ? colors.onAccent : tint ?? colors.textDim;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      hitSlop={4}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        padding: 6,
        borderWidth: 1,
        borderColor: filled ? colors.accent : alpha(color, 0.31),
        backgroundColor: filled ? colors.accent : "transparent",
        borderRadius: radius.sm,
        opacity: enabled ? 1 : 0.4
      }}
    >
      <BrandIcon name={icon} color={color} size={16} />
      {badge && <Text style={{
          fontSize: font.size.label,
          fontWeight: "600",
          color,
          fontVariant: ["tabular-nums"]
        }}>{badge}</Text>}
    </TouchableOpacity>
  );
}

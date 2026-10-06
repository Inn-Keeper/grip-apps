import { Text, View } from "react-native";
import { t } from "@grip/core/i18n";
import { TALK_TRACK_SECTIONS } from "@grip/core/talkTrack";
import { colors, font } from "@/theme";
import { Button, MiniButton } from "@/components/ui";
import { BrandIcon } from "@/components/BrandIcon";

export type Chrome = "full" | "compact" | "zen";

type Props = {
  chrome: Chrome;
  onChrome: (next: Chrome) => void;
  scenarioName: string;
  cost: number;
  budget: number;
  maint: number;
  talkAnswered: number;
  scaleOpen: boolean;
  talkOpen: boolean;
  savedOpen: boolean;
  saving: boolean;
  canEvaluate: boolean;
  onOpenScale: () => void;
  onOpenTalk: () => void;
  onToggleSaved: () => void;
  onSave: () => void;
  onClear: () => void;
  onEvaluate: () => void;
};

// The board's action row: chrome toggles, live cost and upkeep, and the board actions.
export function BoardToolbar({
  chrome, onChrome, scenarioName, cost, budget, maint, talkAnswered, scaleOpen, talkOpen, savedOpen,
  saving, canEvaluate, onOpenScale, onOpenTalk, onToggleSaved, onSave, onClear, onEvaluate,
}: Props) {
  const overBudget = cost > budget;
  return (
    // Wraps onto a second line on narrow screens so every action stays reachable.
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 6 }}>
      <MiniButton
        label={chrome === "full" ? t("board.chromeHide") : t("board.chromeShow")}
        color={colors.textDim}
        onPress={() => onChrome(chrome === "full" ? "compact" : "full")}
      />
      <MiniButton label={t("board.zen")} color={colors.textDim} onPress={() => onChrome("zen")} />
      {chrome === "compact" && (
        <Text numberOfLines={1} style={{ fontSize: font.size.small, fontWeight: "600", color: colors.textDim, flexShrink: 1 }}>
          {scenarioName}
        </Text>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <BrandIcon name="cost" color={overBudget ? colors.danger : colors.textDim} size={14} />
        <Text style={{ fontSize: font.size.small, fontWeight: "600", color: overBudget ? colors.danger : colors.textDim }}>
          {cost}/{budget}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <BrandIcon name="maintenance" color={colors.textDim} size={14} />
        <Text style={{ fontSize: font.size.small, fontWeight: "600", color: colors.textDim }}>{maint}</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: "auto", alignItems: "center" }}>
        <MiniButton
          label={t("scale.check")}
          color={scaleOpen ? colors.accent : colors.textDim}
          onPress={onOpenScale}
        />
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

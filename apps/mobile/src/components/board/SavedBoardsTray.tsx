import Animated, { FadeInDown } from "react-native-reanimated";
import { ScrollView, Text, View } from "react-native";
import { t } from "@grip/core/i18n";
import type { Scenario } from "@grip/core/arch";
import type { SavedBoard, Story } from "@grip/core/api";
import { colors, font, shadow } from "@/theme";
import { MiniButton } from "@/components/ui";

// Horizontal strip of saved boards, each with Load and Delete.
type SavedBoardsTrayProps = {
  boards: SavedBoard[];
  scenarios: Scenario[];
  stories: Story[];
  activeId: string | null;
  onLoad: (board: SavedBoard) => void;
  onDelete: (board: SavedBoard) => void;
};

export function SavedBoardsTray({ boards, scenarios, stories, activeId, onLoad, onDelete }: SavedBoardsTrayProps) {
  return (
    <Animated.View entering={FadeInDown.duration(180)} style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ flex: 1, fontSize: font.size.small, fontWeight: "700", color: colors.textDim }}>{t("board.savedBoards")}</Text>
        <Text style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("board.savedTotal", { count: boards.length })}</Text>
      </View>
      {boards.length === 0 ? (
        <View style={{ padding: 10, backgroundColor: colors.well, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
          <Text style={{ fontSize: font.size.small, color: colors.textFaint }}>{t("board.savedEmpty")}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
          {boards.map((board) => {
            const scenario = scenarios.find((item) => item.id === board.scenarioId);
            const active = board.id === activeId;
            return (
              <View
                key={board.id}
                style={{
                  width: 210,
                  padding: 10,
                  gap: 8,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.borderSoft, boxShadow: shadow.card,
                  borderRadius: 8,
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: font.size.small, fontWeight: "700", color: colors.textBright }}>
                  {board.title}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: font.size.captionLg, color: colors.textFaint }}>
                  {t("board.boardMeta", { scenario: scenario?.name ?? board.scenarioId, nodes: board.nodes.length, edges: board.edges.length })}
                </Text>
                {board.storyId && stories.some((story) => story.id === board.storyId) && (
                  <Text numberOfLines={1} style={{ fontSize: font.size.captionLg, color: colors.accentBright }}>
                    {t("board.saved.story", { title: stories.find((story) => story.id === board.storyId)?.title ?? "" })}
                  </Text>
                )}
                <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                  <MiniButton label={t("common.load")} color={colors.accent} onPress={() => onLoad(board)} />
                  <MiniButton label={t("common.delete")} color={colors.danger} onPress={() => onDelete(board)} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Animated.View>
  );
}

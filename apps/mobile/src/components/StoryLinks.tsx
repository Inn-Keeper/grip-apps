import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Story } from "@grip/core/api";
import { evaluate } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors } from "@/theme";
import { MiniButton } from "@/components/ui";
import { useSavedBoardsQuery, useScenarioCatalog } from "@/queries/board";

const captionStyle = { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, color: colors.textFaint } as const;

// The system behind a story, as on web: its Arch Board scenario and the one board designed for it.
export function StoryLinks({ story }: { story: Story }) {
  const router = useRouter();
  const { allScenarios, isFetching } = useScenarioCatalog();
  const { data: boards = [] } = useSavedBoardsQuery();
  // Boards come newest first, so this is the kept one if duplicates ever slipped in.
  const board = boards.find((item) => item.storyId === story.id);
  const scenario = story.scenarioId ? allScenarios.find((item) => item.id === story.scenarioId) : undefined;
  // Only a settled list proves the scenario is gone; one created on web may still be loading.
  const scenarioMissing = story.scenarioId && !scenario && !isFetching;
  const boardScenario = board ? allScenarios.find((item) => item.id === board.scenarioId) : undefined;
  const score = board && boardScenario ? evaluate(boardScenario, board.nodes, board.edges).score : null;

  if (!scenario && !scenarioMissing && !board) return null;

  return (
    <View style={{ gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft }}>
      {scenarioMissing && <Text style={{ fontSize: 12, color: colors.textFaint }}>{t("stories.scenarioMissing")}</Text>}
      {scenario && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={captionStyle}>{t("stories.scenario").toUpperCase()}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{scenario.name}</Text>
          </View>
          {/* One board per story: once it exists, its Open below is the way in. */}
          {!board && (
            <MiniButton
              label={t("stories.newBoard")}
              color={colors.accentBright}
              onPress={() => router.navigate({ pathname: "/board", params: { scenarioId: scenario.id, storyId: story.id } })}
            />
          )}
        </View>
      )}
      {board && (
        <View style={{ gap: 4 }}>
          <Text style={captionStyle}>{t("stories.board").toUpperCase()}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSoft }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{board.title}</Text>
              <Text style={{ fontSize: 11.5, color: colors.textFaint }}>
                {[
                  score !== null && t("stories.boardScore", { score }),
                  board.talkGrade != null && t("stories.boardTalkGrade", { grade: board.talkGrade }),
                ].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <MiniButton
              label={t("stories.openBoard")}
              color={colors.accentBright}
              onPress={() => board.id && router.navigate({ pathname: "/board", params: { boardId: board.id } })}
            />
          </View>
        </View>
      )}
    </View>
  );
}

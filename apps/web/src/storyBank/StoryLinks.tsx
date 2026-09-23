import { evaluate } from "@grip/core/arch";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { miniBtn } from "../components/fieldStyles";
import { useScenarioCatalog } from "../archBoard/useScenarioCatalog";
import { openInBoard } from "../lib/boardHandoff";
import { useBoardsQuery } from "../quest/queries";
import type { Story } from "./types";

const captionStyle = { fontSize: font.size.caption, fontWeight: 700, color: colors.textFaint, letterSpacing: "0.08em", marginBottom: 2 } as const;

// The system behind a story: its Arch Board scenario, and the boards designed for this story.
export function StoryLinks({ story }: { story: Story }) {
  const { allScenarios, isFetching, error } = useScenarioCatalog();
  const { data: allBoards = [] } = useBoardsQuery();
  const boards = allBoards.filter((board) => board.storyId === story.id);
  const scenario = story.scenarioId ? allScenarios.find((s) => s.id === story.scenarioId) : undefined;
  // Only a settled, successful list proves it's gone; a refetch after creating one may still be in flight.
  const scenarioMissing = story.scenarioId && !scenario && !isFetching && !error;

  return (
    <>
      {scenarioMissing && <p style={{ margin: "14px 0 0", fontSize: font.size.small, color: colors.textFaint }}>{t("stories.scenarioMissing")}</p>}
      {scenario && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={captionStyle}>{t("stories.scenario").toUpperCase()}</div>
            <span style={{ fontSize: font.size.body, fontWeight: 600, color: colors.text }}>{scenario.name}</span>
          </div>
          <button type="button" onClick={() => openInBoard({ scenarioId: scenario.id, storyId: story.id })} style={{ ...miniBtn(colors.accentBright ?? ""), marginLeft: "auto" }}>
            {t("stories.newBoard")}
          </button>
        </div>
      )}
      {boards.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={captionStyle}>{t("stories.boards").toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {boards.map((board) => {
              const boardScenario = allScenarios.find((s) => s.id === board.scenarioId);
              // Same design score the board shows; unknown until its (custom) scenario is loaded.
              const score = boardScenario ? evaluate(boardScenario as Parameters<typeof evaluate>[0], board.nodes, board.edges).score : null;
              return (
                <div key={board.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "8px 10px", border: `1px solid ${colors.borderSoft}`, borderRadius: 8 }}>
                  <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                    <div style={{ fontSize: font.size.body, fontWeight: 600, color: colors.text, overflowWrap: "anywhere" }}>{board.title}</div>
                    <div style={{ fontSize: font.size.small, color: colors.textFaint }}>
                      {[
                        score !== null && t("stories.boardScore", { score }),
                        board.talkGrade != null && t("stories.boardTalkGrade", { grade: board.talkGrade }),
                        new Date(board.updatedAt ?? "").toLocaleDateString(),
                      ].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button type="button" onClick={() => board.id && openInBoard({ scenarioId: board.scenarioId, boardId: board.id })} style={miniBtn(colors.accentBright ?? "")}>
                    {t("stories.openBoard")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

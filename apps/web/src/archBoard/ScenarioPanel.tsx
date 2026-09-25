import type { ComponentProps } from "react";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { Combobox } from "../components/Combobox";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";
import { BoardStory } from "./BoardStory";
import { CATEGORY_ICONS } from "./constants";
import styles from "./ArchBoard.module.css";
import type { AugmentedScenario } from "./types";

type Props = {
  scenario: AugmentedScenario;
  scenarioCount: number;
  scenarioOptions: ComponentProps<typeof Combobox>["options"];
  onSwitch: (id: string) => void;
  board: { id: string | null; storyId: string | null; onStoryChange: (id: string | null) => void };
  onNewScenario: () => void;
  onDeleteScenario: () => void;
  errors: (string | null)[];
};

const errorStyle = { margin: "10px 0 0", fontSize: font.size.small, color: colors.dangerBright };

// Left rail: the scenario you are designing for and its brief (rule 4).
export function ScenarioPanel({ scenario, scenarioCount, scenarioOptions, onSwitch, board, onNewScenario, onDeleteScenario, errors }: Props) {
  return (
    <WorkspacePanel>
      <WorkspaceTitle
        icon={<BrandIcon name={CATEGORY_ICONS[scenario.category ?? ""] ?? "board"} color={colors.accentBright} size={17} />}
        title={t("board.context")}
        subtitle={t("board.scenarioCount", { count: scenarioCount })}
      />
      <div style={{ marginTop: 12 }}>
        <Combobox filterable value={scenario.id} options={scenarioOptions} onChange={onSwitch} style={{ width: "100%" }} triggerStyle={{ fontWeight: 600 }} />
      </div>
      {/* The problem every check and figure is judged against; recessed inside its card (rule 24). */}
      {scenario.brief && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, padding: "11px 12px", background: colors.bgDeep, border: `1px solid ${colors.borderSoft}`, borderRadius: 8 }}>
          <span style={{ flex: "0 0 auto", marginTop: 1 }}>
            <BrandIcon name="prompt" color={colors.accentBright} size={15} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: "0 0 5px", fontSize: font.size.label, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.textFaint }}>
              {t("board.briefLabel")}
            </h3>
            <p style={{ margin: 0, fontSize: font.size.body, lineHeight: 1.6, color: colors.text }}>{scenario.brief}</p>
          </div>
        </div>
      )}
      <BoardStory boardId={board.id} scenarioId={scenario.id} storyId={board.storyId} onChange={board.onStoryChange} />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button type="button" className={styles.toolbarButton} onClick={onNewScenario} style={{ display: "flex", alignItems: "center", gap: 5, color: colors.accentBright }}>
          <BrandIcon name="board" color={colors.accentBright} size={13} />
          {t("board.newScenario")}
        </button>
        {scenario.custom && (
          <button type="button" className={styles.toolbarButton} onClick={onDeleteScenario} style={{ color: colors.dangerBright }}>
            {t("common.delete")}
          </button>
        )}
      </div>
      {errors.filter(Boolean).map((message) => (
        <p key={message} role="alert" style={errorStyle}>{message}</p>
      ))}
    </WorkspacePanel>
  );
}

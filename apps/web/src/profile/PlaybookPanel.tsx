import { t } from "@grip/core/i18n";
import type { ActivePlaybook } from "@grip/core/api";
import { colors } from "../lib/tokens";
import { miniBtn } from "../components/fieldStyles";
import { ErrorText } from "../components/ErrorText";
import { WorkspacePanel } from "../components/WorkspaceLayout";
import { openInBoard } from "../lib/boardHandoff";
import { useCountdown } from "../firstRun/generationErrors";
import { useCustomScenariosQuery } from "../archBoard/queries";
import { useStoriesQuery } from "../storyBank/queries";
import styles from "./Preparation.module.css";

type Key = Parameters<typeof t>[0];
export type PlaybookStatus = "none" | "legacy" | "current" | "changed" | "generating" | "failed" | "interrupted";

type Props = {
  status: PlaybookStatus;
  active: ActivePlaybook | null;
  hasSetup: boolean;
  available: boolean;
  error: { key: string; retryAfter: number | null } | null;
  onSetUp: () => void;
  onStart: () => void;
  onRetry: () => void;
  onOpen: () => void;
};

// The one primary action on Your preparation, with the previous playbook always reachable.
export function PlaybookPanel({ status, active, hasSetup, available, error, onSetUp, onStart, onRetry, onOpen }: Props) {
  const retryLeft = useCountdown(error?.retryAfter ?? null);
  const canOpen = !!active && status !== "current" && status !== "none";
  const failed = status === "failed" || status === "interrupted";
  const primary = (label: Key, onClick: () => void, disabled = false) => (
    <button type="button" onClick={onClick} disabled={disabled} style={miniBtn(colors.accentBright ?? "")}>
      {t(label)}
    </button>
  );

  return (
    <WorkspacePanel style={{
        padding: 20,
        marginBottom: 16
      }}>
      <div className={styles.heading} aria-live="polite">
        <div style={{
            minWidth: 0,
            flex: "1 1 260px"
          }}>
          <h2>{t(`profile.playbook.${status}.title` as Key)}</h2>
          <p className={styles.muted}>{t(`profile.playbook.${status}.sub` as Key)}</p>
          {canOpen && (
            <button type="button" className={styles.link} onClick={onOpen} style={{ marginTop: 8 }}>
              {t("profile.playbook.openPrevious")}
            </button>
          )}
        </div>
        {status === "generating" && (
          <button type="button" disabled aria-busy="true" style={miniBtn(colors.accentBright ?? "")}>
            {t("profile.playbook.updating")}
          </button>
        )}
        {status === "current" && primary("profile.playbook.open", onOpen)}
        {status === "none" && !hasSetup && primary("profile.playbook.setUp", onSetUp)}
        {available && status === "none" && hasSetup && primary("profile.playbook.create", onStart)}
        {available && (status === "changed" || status === "legacy") && primary("profile.playbook.update", onStart)}
        {available && failed && (
          <button type="button" onClick={onRetry} disabled={retryLeft > 0} style={miniBtn(colors.accentBright ?? "")}>
            {retryLeft > 0 ? t("firstRun.generate.retryIn", { seconds: retryLeft }) : t("profile.playbook.retry")}
          </button>
        )}
      </div>
      {!available && status !== "current" && hasSetup && <p className={styles.muted}>{t("firstRun.review.noAi")}</p>}
      {error && <ErrorText margin="10px 0 0">{t(error.key as Key)}</ErrorText>}
    </WorkspacePanel>
  );
}

// /profile/preparation/playbook: the saved playbook and links to its real outputs.
export function PlaybookSummary({ active, onBack, onPage }: { active: ActivePlaybook | null; onBack: () => void; onPage: (page: string) => void }) {
  const { data: stories = [], isLoading: storiesLoading } = useStoriesQuery();
  const { data: scenarios = [], isLoading: scenariosLoading } = useCustomScenariosQuery();
  if (!active) {
    return (
      <WorkspacePanel style={{ padding: 20 }}>
        <p className={styles.muted}>{t("profile.playbook.missing")}</p>
        <button type="button" className={styles.link} onClick={onBack}>{t("profile.notFoundAction")}</button>
      </WorkspacePanel>
    );
  }
  const storyCount = stories.filter((story: { id?: string }) => story.id && active.storyIds.includes(story.id)).length;
  const scenarioExists = scenarios.some((s: { id: string }) => s.id === active.scenarioId);
  const loading = storiesLoading || scenariosLoading;
  return (
    <WorkspacePanel style={{ padding: 20 }}>
      <h2 className={styles.value} style={{ margin: 0 }}>{active.label}</h2>
      <p className={styles.muted}>
        {t("profile.playbook.createdAt", { time: new Date(active.createdAt).toLocaleString() })}
        {active.snapshot.techs.length > 0 && ` · ${active.snapshot.techs.join(", ")}`}
      </p>
      <div className={styles.row}>
        <span className={styles.value}>{t("tabs.prep")}</span>
        <button type="button" className={styles.link} onClick={() => onPage("prep")}>{t("profile.playbook.goPrep")}</button>
      </div>
      <div className={styles.row}>
        <span className={styles.value}>{t("profile.playbook.stories", { count: storyCount })}</span>
        <button type="button" className={styles.link} onClick={() => onPage("stories")}>{t("profile.playbook.goStories")}</button>
      </div>
      <div className={styles.row}>
        <span className={styles.value}>{t("tabs.board")}</span>
        {scenarioExists || loading ? (
          <button
            type="button"
            className={styles.link}
            onClick={() => openInBoard(active.boardId ? { scenarioId: active.scenarioId, boardId: active.boardId } : { scenarioId: active.scenarioId })}
          >
            {t("profile.playbook.goBoard")}
          </button>
        ) : (
          <span className={styles.muted}>{t("profile.playbook.boardDeleted")}</span>
        )}
      </div>
      <button type="button" className={styles.link} onClick={onBack} style={{ marginTop: 12 }}>{t("profile.playbook.back")}</button>
    </WorkspacePanel>
  );
}

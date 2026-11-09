import { t } from "@grip/core/i18n";
import type { PreparationRecord, User } from "@grip/core/api";
import { toggleFavoriteTech } from "@grip/core/user";
import { ErrorText } from "../components/ErrorText";
import { WorkspacePanel } from "../components/WorkspaceLayout";
import { useSaveFavoriteTechsMutation } from "./queries";
import { profilePath } from "./routes.js";
import styles from "./Preparation.module.css";

type Props = {
  profile: User | null;
  preparation: PreparationRecord | null;
  catalogue: string[];
  onEdit: () => void;
  // The playbook action/status card (Task 5) and the experience sources (Task 4).
  playbook?: React.ReactNode;
  sources?: React.ReactNode;
};

// Overview order: playbook, summary, preferred technologies, experience sources.
export function PreparationSection({ profile, preparation, catalogue, onEdit, playbook, sources }: Props) {
  const goal = preparation?.goal;
  const stack = profile?.goalTechs ?? [];
  return (
    <>
      {playbook}
      <WorkspacePanel style={{
          padding: 20,
          marginBottom: 16
        }}>
        <div className={styles.heading}>
          <h2>{t("profile.preparation.summary")}</h2>
          <a
            href={profilePath("edit")}
            className={styles.link}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              onEdit();
            }}
          >
            {t("profile.preparation.edit")}
          </a>
        </div>
        <div className={styles.summary}>
          <div>
            <span className={styles.label}>{t("firstRun.role.label")}</span>
            <span className={styles.value}>{profile?.targetRole || t("profile.preparation.notChosen")}</span>
          </div>
          <div>
            <span className={styles.label}>{t("profile.preparation.focus")}</span>
            <span className={styles.value}>{goal ? t(`firstRun.goal.${goal}`) : t("profile.preparation.notChosen")}</span>
          </div>
        </div>
        <span className={styles.label}>{t("profile.preparation.stack")}</span>
        <div className={styles.chips}>
          {stack.length ? stack.map((tech) => <span key={tech} className={styles.chip}>{tech}</span>) : (
            <span className={styles.muted}>{t("profile.preparation.noStack")}</span>
          )}
        </div>
        <PreferredTechs profile={profile} catalogue={catalogue} />
      </WorkspacePanel>
      {sources}
    </>
  );
}

// Inline favourites: one small explicit save per toggle. While pending, toggles are blocked;
// on failure the cache was never changed, so the previous selection stays.
function PreferredTechs({ profile, catalogue }: { profile: User | null; catalogue: string[] }) {
  const save = useSaveFavoriteTechsMutation();
  const favourites = profile?.favoriteTechs ?? [];
  const known = new Set(catalogue);
  const choices = [...new Set([...(profile?.goalTechs ?? []), ...favourites, ...catalogue])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  return (
    <>
      <span className={styles.label} id="prep-preferred">{t("profile.favoriteTechs")}</span>
      <p className={styles.muted} style={{ margin: "0 0 10px" }}>{t("profile.preparation.preferredHint")}</p>
      <div className={styles.chips} role="group" aria-labelledby="prep-preferred">
        {choices.map((tech) => (
          <button
            key={tech}
            type="button"
            className={styles.chip}
            aria-pressed={favourites.includes(tech)}
            disabled={!profile || save.isPending}
            title={known.has(tech) ? undefined : t("profile.preparation.noDrills")}
            onClick={() => save.mutate(toggleFavoriteTech(favourites, tech))}
          >
            {tech}
            {!known.has(tech) && <span className={styles.muted}> · {t("profile.preparation.custom")}</span>}
          </button>
        ))}
      </div>
      {save.error && <ErrorText margin="10px 0 0">{(save.error as Error).message}</ErrorText>}
    </>
  );
}

import { useEffect, useState } from "react";
import { t } from "@grip/core/i18n";
import { FIRST_RUN_LIMITS } from "@grip/core/firstRun";
import type { PreparationRecord, User } from "@grip/core/api";
import { colors } from "../lib/tokens";
import { fieldStyle, miniBtn, textareaFieldStyle } from "../components/fieldStyles";
import { ErrorText } from "../components/ErrorText";
import { WorkspacePanel } from "../components/WorkspaceLayout";
import { useUnsavedGuard } from "../lib/useUnsavedGuard";
import { useSavePreparationMutation } from "./queries";
import { addTech, createPreparationDraft, isDraftDirty, preparationPatch, toggleTech } from "./preparationState.js";
import styles from "./Preparation.module.css";

const GOALS = ["technical", "stories", "design", "explore"] as const;

type Props = {
  profile: User;
  preparation: PreparationRecord | null;
  catalogue: string[];
  // Called after a successful save or a confirmed cancel; the caller navigates to the overview.
  onDone: (saved: boolean) => void;
  // Optional import review; receives the draft CV detections and a setter.
  importSlot?: (cvTechs: string[], onCv: (techs: string[]) => void) => React.ReactNode;
};

// Detached draft: nothing persists until Save, and a server refetch never overwrites it.
export function PreparationEditor({ profile, preparation, catalogue, onDone, importSlot }: Props) {
  const [draft, setDraft] = useState(() => createPreparationDraft(profile, preparation));
  const [newTech, setNewTech] = useState("");
  const [saved, setSaved] = useState(false);
  const save = useSavePreparationMutation();
  const dirty = !saved && isDraftDirty(draft, profile, preparation);
  useUnsavedGuard(dirty);

  // Navigate only once the guard has been released by the render above.
  useEffect(() => {
    if (saved) onDone(true);
  }, [saved, onDone]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const favouriteChoices = [...new Set([...draft.techs, ...draft.favoriteTechs, ...catalogue])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (save.isPending) return;
    save.mutate(preparationPatch(draft), { onSuccess: () => setSaved(true) });
  };
  const addTyped = () => {
    set("techs", addTech(draft.techs, newTech));
    setNewTech("");
  };

  return (
    <form onSubmit={submit}>
      <WorkspacePanel style={{
          padding: 20,
          marginBottom: 16
        }}>
        <div className={styles.field}>
          <label htmlFor="prep-role">{t("firstRun.role.label")}</label>
          <input
            id="prep-role"
            value={draft.role}
            maxLength={FIRST_RUN_LIMITS.role}
            placeholder={t("firstRun.role.placeholder")}
            onChange={(e) => set("role", e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="prep-goal">{t("profile.preparation.focus")}</label>
          <select id="prep-goal" value={draft.goal} onChange={(e) => set("goal", e.target.value as typeof draft.goal)} style={fieldStyle}>
            {GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {t(`firstRun.goal.${goal}`)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="prep-brief">{t("profile.preparation.brief")}</label>
          <textarea
            id="prep-brief"
            value={draft.brief}
            maxLength={FIRST_RUN_LIMITS.brief}
            placeholder={t("firstRun.goal.briefPlaceholder")}
            onChange={(e) => set("brief", e.target.value)}
            style={textareaFieldStyle}
            rows={3}
          />
        </div>
      </WorkspacePanel>

      <WorkspacePanel style={{
          padding: 20,
          marginBottom: 16
        }}>
        <span className={styles.fieldLabel} id="prep-stack-label">{t("profile.preparation.stack")}</span>
        <div className={styles.chips} role="group" aria-labelledby="prep-stack-label" style={{ marginTop: 8 }}>
          {draft.techs.length === 0 && <span className={styles.muted}>{t("profile.preparation.noStack")}</span>}
          {draft.techs.map((tech) => (
            <button
              key={tech}
              type="button"
              className={styles.chip}
              aria-label={t("profile.preparation.removeTech", { tech })}
              onClick={() => set("techs", draft.techs.filter((x) => x !== tech))}
            >
              {tech} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
        <div className={styles.field}>
          <label htmlFor="prep-add">{t("profile.preparation.addTech")}</label>
          <div className={styles.inline}>
            <input
              id="prep-add"
              value={newTech}
              maxLength={60}
              list="prep-catalogue"
              onChange={(e) => setNewTech(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                addTyped();
              }}
              style={fieldStyle}
            />
            <datalist id="prep-catalogue">
              {catalogue.map((tech) => <option key={tech} value={tech} />)}
            </datalist>
            <button type="button" onClick={addTyped} disabled={!newTech.trim()} style={miniBtn(colors.accentBright ?? "")}>
              {t("profile.preparation.add")}
            </button>
          </div>
        </div>

        <span className={styles.label} id="prep-fav-label">{t("profile.favoriteTechs")}</span>
        <p className={styles.muted} style={{ margin: "0 0 10px" }}>{t("profile.preparation.preferredHint")}</p>
        <div className={styles.chips} role="group" aria-labelledby="prep-fav-label">
          {favouriteChoices.map((tech) => (
            <button
              key={tech}
              type="button"
              className={styles.chip}
              aria-pressed={draft.favoriteTechs.includes(tech)}
              onClick={() => set("favoriteTechs", toggleTech(draft.favoriteTechs, tech))}
            >
              {tech}
            </button>
          ))}
        </div>
      </WorkspacePanel>

      {/* Detected CV techs join the draft stack; clearing forgets the detections but keeps chosen techs. */}
      {importSlot?.(draft.cvTechs, (techs) =>
        setDraft((d) => ({ ...d, cvTechs: techs, techs: [...new Set([...d.techs, ...techs])] })),
      )}

      <div className={styles.actions}>
        <button type="submit" disabled={save.isPending || !dirty} aria-busy={save.isPending} style={miniBtn(colors.accentBright ?? "")}>
          {save.isPending ? t("common.saving") : t("common.save")}
        </button>
        <button type="button" onClick={() => onDone(false)} style={miniBtn(colors.textDim ?? "")}>
          {t("common.cancel")}
        </button>
        {dirty && <span className={styles.muted}>{t("profile.preparation.unsavedHint")}</span>}
        {save.error && <ErrorText>{t("profile.saveFailed", { message: (save.error as Error).message })}</ErrorText>}
      </div>
    </form>
  );
}

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLocale, t } from "@grip/core/i18n";
import { landingFor, playbookLabel, publishablePlaybook } from "@grip/core/firstRun";
import type { User } from "@grip/core/api";
import { ErrorText } from "../components/ErrorText";
import * as api from "../lib/api";
import { archBoardQueryKeys } from "../archBoard/queries";
import { storyQueryKeys } from "../storyBank/queries";
import { colors, font, space } from "../lib/tokens";
import { PoeWalk } from "./PoeWalk";
import { ghostBtn, primaryBtn } from "./styles";
import { playbookRequest, preparationSave, prepPlanTechs, type WizardState } from "./wizardState.js";
import { snapshotFor } from "../profile/preparationState.js";
import { profileQueryKeys } from "../profile/queries";
import { startPrepFocus, writePrepPlan } from "../lib/prepPlanHandoff";
import { generateWithTimeout } from "./generationRequest.js";
import { ERROR_KEYS, useCountdown } from "./generationErrors";

const SLOW_AFTER_MS = 20_000;

type Key = Parameters<typeof t>[0];
type Progress = { scenarioId: string | null; boardId?: string | null };
type Playbook = Parameters<typeof publishablePlaybook>[0];
export type Landing = { page: string; scenarioId: string | null; boardId?: string | null };

// Keep the plan as the outcome; offer practice without it only after a failure.
// Unmounting discards late responses and stops further writes.
export function GenerateStep({ state, profile, onLand }: { state: WizardState; profile: User | null; onLand: (landing: Landing) => void }) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<"writing" | "saving" | "error">("writing");
  const [error, setError] = useState<{ key: string; retryAfter: number | null } | null>(null);
  const playbook = useRef<Playbook | null>(null);
  const progress = useRef<Progress>({ scenarioId: null });
  // One id per visit: a retried publish of the same playbook is idempotent on the server.
  const generationId = useRef(crypto.randomUUID());
  const abort = useRef<AbortController | null>(null);
  const operation = useRef<"writing" | "saving" | null>(null);
  const departed = useRef(false);
  const retryLeft = useCountdown(error?.retryAfter ?? null);
  const goal = state.goal || "explore";
  const label = playbookLabel({ role: state.role, goal });

  // Prep picks the plan up as its banner, so the goals show up there too.
  const land = () => {
    if (departed.current) return;
    departed.current = true;
    const techs = prepPlanTechs(state);
    if (techs.length) writePrepPlan({ name: label, deadline: "", techs });
    // Only a published plan has stories and a board to point at; skipping setup lands on the normal dashboard.
    if (progress.current.scenarioId) startPrepFocus({ scenarioId: progress.current.scenarioId, boardId: progress.current.boardId ?? null });
    onLand({ page: landingFor(goal), scenarioId: progress.current.scenarioId, boardId: progress.current.boardId ?? null });
  };

  // Same publish path as Profile: artifacts and the active manifest land together, or not at all.
  const save = async (signal: AbortSignal) => {
    signal.throwIfAborted();
    operation.current = "saving";
    setPhase("saving");
    const saved = preparationSave(state, profile);
    const current = await api.getPreparation();
    signal.throwIfAborted();
    const manifest = await api.publishPreparationPlaybook({
      generationId: generationId.current,
      expectedGenerationId: current?.activePlaybook?.generationId ?? null,
      snapshot: snapshotFor({ targetRole: saved.profilePatch.targetRole, goalTechs: saved.profilePatch.goalTechs, favoriteTechs: saved.profilePatch.favoriteTechs }, { goal: saved.goal, brief: saved.brief }, getLocale()),
      label,
      playbook: publishablePlaybook(playbook.current!) as never,
    });
    if (signal.aborted || departed.current) return;
    // Saved now, not only on landing, so a reload after publish can't show setup and build a second plan.
    await api.updateProfile({ onboardingCompleted: true }).catch(() => undefined);
    if (signal.aborted || departed.current) return;
    progress.current = { scenarioId: manifest.scenarioId, boardId: manifest.boardId };
    queryClient.invalidateQueries({ queryKey: storyQueryKeys.stories });
    queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.customScenarios });
    queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.boards });
    queryClient.invalidateQueries({ queryKey: profileQueryKeys.preparation });
    land();
  };

  const run = async () => {
    if (operation.current || departed.current) return;
    const controller = new AbortController();
    abort.current = controller;
    operation.current = "writing";
    setError(null);
    try {
      if (!playbook.current) {
        setPhase("writing");
        playbook.current = await generateWithTimeout(
          (signal) => api.playbookApi!.generatePlaybook(playbookRequest(state, getLocale()), { signal }),
          controller.signal,
        );
      }
      if (controller.signal.aborted || departed.current) return;
      await save(controller.signal);
    } catch (e) {
      if (controller.signal.aborted || departed.current) return;
      const err = e as { code?: string; retryAfter?: number | null };
      fail(ERROR_KEYS[err.code ?? ""] ? err.code! : "generic", err.retryAfter ?? null);
    } finally {
      operation.current = null;
    }
  };

  const fail = (code: string, retryAfter: number | null) => {
    setError({ key: ERROR_KEYS[code] ?? "firstRun.error.generic", retryAfter });
    setPhase("error");
  };

  useEffect(() => {
    let mounted = true;
    // StrictMode's probe unmounts before this microtask, so only the live mount sends.
    queueMicrotask(() => {
      if (!mounted) return;
      if (!api.playbookApi) land();
      else run();
    });
    return () => {
      mounted = false;
      abort.current?.abort();
    };
    // Runs once per visit to this step; the Review button is the only way in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A slow or overloaded model can hold "writing" for minutes; offer a way out once it drags.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => window.clearTimeout(id);
  }, []);
  // Nothing is stored until the playbook arrives, so leaving while writing is safe.
  const skipWait = () => {
    if (operation.current !== "writing") return;
    abort.current?.abort();
    land();
  };

  const instead = () => {
    // A retry can start before React has removed the failure actions.
    if (operation.current) return;
    abort.current?.abort();
    land();
  };

  return (
    <div style={{
        display: "flex",
        flexDirection: "column",
        gap: space.xl
      }}>
      {(phase === "writing" || phase === "saving") && <PoeWalk saving={phase === "saving"} />}
      {error && <ErrorText>{t(error.key as Key)}</ErrorText>}
      {phase === "error" && <div style={{
          display: "flex",
          gap: space.md,
          flexWrap: "wrap"
        }}>
        <button type="button" onClick={run} disabled={retryLeft > 0} style={primaryBtn(retryLeft === 0)}>
          {retryLeft > 0 ? t("firstRun.generate.retryIn", { seconds: retryLeft }) : t("firstRun.generate.retry")}
        </button>
        <button type="button" onClick={instead} style={ghostBtn}>
          {t("firstRun.generate.instead")}
        </button>
      </div>}
      {(phase === "writing" || phase === "saving") && <p role="status" style={{
        margin: 0,
        color: colors.textDim,
        fontSize: font.size.body
      }}>{t(phase === "saving" ? "firstRun.generate.finishing" : "firstRun.generate.waitHint")}</p>}
      {phase === "writing" && slow && (
        <button type="button" onClick={skipWait} style={{
            ...ghostBtn,
            alignSelf: "flex-start"
          }}>
          {t("firstRun.generate.instead")}
        </button>
      )}
    </div>
  );
}

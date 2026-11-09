import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { playbookLabel, publishablePlaybook } from "@grip/core/firstRun";
import type { PreparationSnapshot } from "@grip/core/api";
import * as api from "../lib/api";
import { writePrepPlan } from "../lib/prepPlanHandoff";
import { generateWithTimeout } from "../firstRun/generationRequest.js";
import { ERROR_KEYS } from "../firstRun/generationErrors";
import { archBoardQueryKeys } from "../archBoard/queries";
import { storyQueryKeys } from "../storyBank/queries";
import { profileQueryKeys } from "./queries";
import { clearAttempt, orderedTechs, preparationRequest, readAttempt, writeAttempt } from "./playbookState.js";

export type GenerationPhase = "idle" | "generating" | "failed" | "interrupted";
type Attempt = {
  id: string;
  snapshot: PreparationSnapshot;
  expectedId: string | null;
  // Kept after a failed publish so Retry never spends another model request.
  playbook: Parameters<typeof publishablePlaybook>[0] | null;
};

/**
 * Owned by Profile, so moving between Profile subroutes keeps an update running.
 * Unmount (leaving Profile, sign-out, account switch) aborts and ignores late responses.
 */
export function usePreparationGeneration(userId: string | null, catalogue: string[]) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<GenerationPhase>(() =>
    userId && readAttempt(window.localStorage, userId) ? "interrupted" : "idle",
  );
  const [error, setError] = useState<{ key: string; retryAfter: number | null } | null>(null);
  const attempt = useRef<Attempt | null>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    attempt.current = null;
    setError(null);
    setPhase(userId && readAttempt(window.localStorage, userId) ? "interrupted" : "idle");
    return () => controller.current?.abort();
  }, [userId]);

  const run = useCallback(async () => {
    const current = attempt.current;
    if (!current || !userId || busy.current || !api.playbookApi) return;
    busy.current = true;
    const abort = new AbortController();
    controller.current = abort;
    setError(null);
    setPhase("generating");
    try {
      if (!current.playbook) {
        current.playbook = await generateWithTimeout(
          (signal) => api.playbookApi!.generatePlaybook(preparationRequest(current.snapshot, catalogue), { signal }),
          abort.signal,
        );
      }
      abort.signal.throwIfAborted();
      const label = playbookLabel({ role: current.snapshot.role, goal: current.snapshot.goal });
      await api.publishPreparationPlaybook({
        generationId: current.id,
        expectedGenerationId: current.expectedId,
        snapshot: current.snapshot,
        label,
        playbook: publishablePlaybook(current.playbook!) as never,
      });
      if (abort.signal.aborted) return;
      clearAttempt(window.localStorage, userId);
      attempt.current = null;
      // Prep's plan banner follows only the inputs this playbook was built from.
      const techs = orderedTechs(current.snapshot, catalogue).slice(0, 8);
      if (techs.length) writePrepPlan({ name: label, deadline: "", techs });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.preparation }),
        queryClient.invalidateQueries({ queryKey: storyQueryKeys.stories }),
        queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.customScenarios }),
        queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.boards }),
      ]);
      setPhase("idle");
    } catch (e) {
      if (abort.signal.aborted && !(e as { code?: string })?.code) return;
      const err = e as { code?: string; retryAfter?: number | null; message?: string };
      // Another device replaced the playbook first: show the new one, nothing was overwritten.
      if (err.message?.includes("playbook_conflict")) queryClient.invalidateQueries({ queryKey: profileQueryKeys.preparation });
      setError({ key: ERROR_KEYS[err.code ?? ""] ?? "firstRun.error.generic", retryAfter: err.retryAfter ?? null });
      setPhase("failed");
    } finally {
      busy.current = false;
    }
  }, [catalogue, queryClient, userId]);

  const start = useCallback(
    (snapshot: PreparationSnapshot, expectedId: string | null) => {
      if (busy.current || !userId) return;
      const id = crypto.randomUUID();
      attempt.current = { id, snapshot, expectedId, playbook: null };
      writeAttempt(window.localStorage, userId, { id, startedAt: new Date().toISOString() });
      run();
    },
    [run, userId],
  );

  // After a reload there is no attempt in memory: Retry starts fresh from saved preparation.
  const retry = useCallback(
    (snapshot: PreparationSnapshot, expectedId: string | null) => (attempt.current ? run() : start(snapshot, expectedId)),
    [run, start],
  );

  return { phase, error, start, retry, available: !!api.playbookApi };
}

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLocale, t } from "@grip/core/i18n";
import { landingFor, playbookLabel, savePlaybook } from "@grip/core/firstRun";
import { ErrorText } from "../components/ErrorText";
import * as api from "../lib/api";
import { archBoardQueryKeys } from "../archBoard/queries";
import { storyQueryKeys } from "../storyBank/queries";
import { colors, font, space } from "../lib/tokens";
import { PoeWalk } from "./PoeWalk";
import { ghostBtn, primaryBtn } from "./styles";
import { playbookRequest, prepPlanTechs, type WizardState } from "./wizardState.js";
import { writePrepPlan } from "../lib/prepPlanHandoff";
import { generateWithTimeout } from "./generationRequest.js";

type Key = Parameters<typeof t>[0];
type Progress = { scenarioId: string | null; boardId?: string | null; saved: string[] };
type Playbook = Parameters<typeof savePlaybook>[0];
export type Landing = { page: string; scenarioId: string | null; boardId?: string | null };

const ERROR_KEYS: Record<string, string> = {
  playbook_daily_limit: "firstRun.error.playbook_daily_limit",
  busy: "firstRun.error.busy",
  provider_limited: "firstRun.error.limited",
  provider_quota_exhausted: "firstRun.error.limited",
  invalid_model_response: "firstRun.error.invalid",
  timeout: "firstRun.error.timeout",
};

/** Seconds left on a Retry-After countdown, ticking once a second. */
function useCountdown(seconds: number | null) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!seconds) return setLeft(0);
    setLeft(seconds);
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);
  return left;
}

// Keep the plan as the outcome; offer practice without it only after a failure.
// Unmounting discards late responses and stops further writes.
export function GenerateStep({ state, onLand }: { state: WizardState; onLand: (landing: Landing) => void }) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<"writing" | "saving" | "error" | "partial">("writing");
  const [error, setError] = useState<{ key: string; retryAfter: number | null } | null>(null);
  const [partial, setPartial] = useState<{ saved: number; total: number } | null>(null);
  const playbook = useRef<Playbook | null>(null);
  const progress = useRef<Progress>({ scenarioId: null, saved: [] });
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
    onLand({ page: landingFor(goal), scenarioId: progress.current.scenarioId, boardId: progress.current.boardId ?? null });
  };

  const save = async (signal: AbortSignal) => {
    signal.throwIfAborted();
    operation.current = "saving";
    setPhase("saving");
    const result = await savePlaybook(
      playbook.current!,
      {
        label,
        upsertCustomScenario: (scenario) => { signal.throwIfAborted(); return api.upsertCustomScenario(scenario); },
        upsertBoard: (board) => { signal.throwIfAborted(); return api.upsertBoard(board); },
        upsertStory: (story) => { signal.throwIfAborted(); return api.upsertStory(story); },
      },
      progress.current,
    );
    if (signal.aborted || departed.current) return;
    progress.current = result;
    queryClient.invalidateQueries({ queryKey: storyQueryKeys.stories });
    queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.customScenarios });
    queryClient.invalidateQueries({ queryKey: archBoardQueryKeys.boards });
    if (result.failed.length) {
      setPartial({ saved: result.saved.length, total: playbook.current!.stories.length });
      return setPhase("partial");
    }
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
      {phase === "partial" && partial && <ErrorText>{t("firstRun.generate.partial", partial)}</ErrorText>}
      {(phase === "error" || phase === "partial") && <div style={{
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
    </div>
  );
}

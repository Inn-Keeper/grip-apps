import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getLocale, t } from "@grip/core/i18n";
import { landingFor, playbookLabel, savePlaybook } from "@grip/core/firstRun";
import { ErrorText } from "../components/ErrorText";
import * as api from "../lib/api";
import { archBoardQueryKeys } from "../archBoard/queries";
import { storyQueryKeys } from "../storyBank/queries";
import { space } from "../lib/tokens";
import { PoeWalk } from "./PoeWalk";
import { ghostBtn, primaryBtn } from "./styles";
import { playbookRequest, prepPlanTechs, type WizardState } from "./wizardState.js";
import { writePrepPlan } from "../lib/prepPlanHandoff";

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

// Owns the one generation request and the saves; started by the Review button,
// so a double click or a remount cannot send it twice.
export function GenerateStep({ state, onLand }: { state: WizardState; onLand: (landing: Landing) => void }) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<"writing" | "saving" | "error" | "partial">("writing");
  const [error, setError] = useState<{ key: string; retryAfter: number | null } | null>(null);
  const [partial, setPartial] = useState<{ saved: number; total: number } | null>(null);
  const playbook = useRef<Playbook | null>(null);
  const progress = useRef<Progress>({ scenarioId: null, saved: [] });
  const abort = useRef<AbortController | null>(null);
  const started = useRef(false);
  const retryLeft = useCountdown(error?.retryAfter ?? null);
  const goal = state.goal || "explore";
  const label = playbookLabel({ role: state.role, goal });

  // Prep picks the plan up as its banner, so the goals show up there too.
  const land = () => {
    const techs = prepPlanTechs(state);
    if (techs.length) writePrepPlan({ name: label, deadline: "", techs });
    onLand({ page: landingFor(goal), scenarioId: progress.current.scenarioId, boardId: progress.current.boardId ?? null });
  };

  const save = async () => {
    setPhase("saving");
    const result = await savePlaybook(
      playbook.current!,
      { label, upsertCustomScenario: api.upsertCustomScenario, upsertBoard: api.upsertBoard, upsertStory: api.upsertStory },
      progress.current,
    );
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
    setError(null);
    if (playbook.current) return save().catch(() => fail("generic", null));
    setPhase("writing");
    abort.current = new AbortController();
    try {
      playbook.current = await api.playbookApi!.generatePlaybook(
        playbookRequest(state, getLocale()),
        { signal: abort.current.signal },
      );
      await save();
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const err = e as { code?: string; retryAfter?: number | null };
      fail(ERROR_KEYS[err.code ?? ""] ? err.code! : "generic", err.retryAfter ?? null);
    }
  };

  const fail = (code: string, retryAfter: number | null) => {
    setError({ key: ERROR_KEYS[code] ?? "firstRun.error.generic", retryAfter });
    setPhase("error");
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!api.playbookApi) return land();
    run();
    // Runs once per visit to this step; the Review button is the only way in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const instead = () => {
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
      <div style={{
          display: "flex",
          gap: space.md,
          flexWrap: "wrap"
        }}>
        {(phase === "error" || phase === "partial") && (
          <button type="button" onClick={run} disabled={retryLeft > 0} style={primaryBtn(retryLeft === 0)}>
            {retryLeft > 0 ? t("firstRun.generate.retryIn", { seconds: retryLeft }) : t("firstRun.generate.retry")}
          </button>
        )}
        <button type="button" onClick={instead} style={ghostBtn}>
          {t("firstRun.generate.instead")}
        </button>
      </div>
    </div>
  );
}

// The optimistic score store shared by web and mobile, free of React so each app binds it
// to its own @tanstack/react-query copy (web and mobile resolve different React versions).
import { CORRECT_XP } from "./gamification.js";
import { difficultyByKey } from "./difficulty.js";
import type { Scores } from "./api";

export type RecordArgs = { scope: string; requestId: string; tech: string; isCorrect: boolean; source: string; difficulty: string | null; retry?: boolean };
// Failed writes, kept in the query cache so a sign-out or account switch (queryClient.clear) drops them.
export type Unsaved = { scope: string; answers: RecordArgs[]; bonusFailed: number };
export type SaveStatus = { pending: number; failed: number; bonusFailed: number; loadFailed: boolean; retry: () => void };
export type ScoreApi = {
  getScores: () => Promise<Scores>;
  recordAnswer: (tech: string, isCorrect: boolean, source: string, difficulty: string | null, requestId: string) => Promise<unknown>;
  addXp: (points: number) => Promise<unknown>;
};

// The QueryClient methods the store uses, typed structurally so core needs no query dependency.
type MutationEvent = { type: string; action?: { type: string }; mutation?: { options: { mutationKey?: readonly unknown[] }; state: { variables?: unknown } } };
export type ScoreClient = {
  getQueryData: <T>(key: readonly unknown[]) => T | undefined;
  setQueryData: (key: readonly unknown[], updater: (old: any) => any) => unknown;
  cancelQueries: (filters: { queryKey: readonly unknown[] }) => Promise<unknown>;
  invalidateQueries: (filters: { queryKey: readonly unknown[] }) => Promise<unknown>;
  isMutating: (filters: { mutationKey: readonly unknown[] }) => number;
  getMutationCache: () => { subscribe: (listener: (event: MutationEvent) => void) => () => void };
};

export const EMPTY_SCORES: Scores = { xp: 0, answers: {} };
export const freshUnsaved = (): Unsaved => ({ scope: newRequestId(), answers: [], bonusFailed: 0 });
export const SCORES_KEY = ["scores"] as const;
// Ignore any persisted retry queue created before account scoping was added.
export const UNSAVED_KEY = ["unsaved-progress-v2"] as const;
export const WRITE_KEY = ["score-write"] as const;

export const newRequestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** Scores after one answer: XP by difficulty when correct, and the tech's tally. */
export const applyAnswer = (s: Scores, { tech, isCorrect, difficulty }: Pick<RecordArgs, "tech" | "isCorrect" | "difficulty">): Scores => ({
  xp: s.xp + (isCorrect ? (difficultyByKey(difficulty ?? "")?.xp ?? CORRECT_XP) : 0),
  answers: {
    ...s.answers,
    [tech]: {
      correct: (s.answers[tech]?.correct ?? 0) + (isCorrect ? 1 : 0),
      wrong: (s.answers[tech]?.wrong ?? 0) + (isCorrect ? 0 : 1),
    },
  },
});

const subscribed = new WeakSet<object>();

/**
 * Refetch scores once every write has settled, so a refetch never drops another write's
 * optimistic progress. One listener per client however many components use the store.
 * ponytail: never unsubscribed, the client lives as long as the app.
 */
export function watchScoreWrites(client: ScoreClient) {
  if (subscribed.has(client)) return;
  subscribed.add(client);
  client.getMutationCache().subscribe((event) => {
    if (event.type !== "updated" || (event.action?.type !== "success" && event.action?.type !== "error")) return;
    if (event.mutation?.options.mutationKey?.[0] !== WRITE_KEY[0]) return;
    const args = event.mutation.state.variables as { scope?: string } | undefined;
    if (args?.scope !== client.getQueryData<Unsaved>(UNSAVED_KEY)?.scope) return;
    if (client.isMutating({ mutationKey: WRITE_KEY }) === 0) client.invalidateQueries({ queryKey: SCORES_KEY });
  });
}

/**
 * Mutation options for answers and bonus XP. A failed write is not rolled back: the settle
 * refetch shows server truth, since an ambiguous failure may have landed and an overlay
 * would count it twice. Retry with the same request id restores it at most once.
 */
export function scoreMutations(client: ScoreClient, api: ScoreApi) {
  // Auth clears the query cache on identity changes. A unique queue scope also
  // rejects late callbacks after switching away and back to the same account.
  const currentScope = client.getQueryData<Unsaved>(UNSAVED_KEY)?.scope;
  const isCurrent = (scope: string) => !!scope && client.getQueryData<Unsaved>(UNSAVED_KEY)?.scope === scope;
  const requireCurrent = (scope: string) => {
    if (!isCurrent(scope)) throw new Error("The active account changed.");
  };
  const patch = (scope: string, updater: (s: Scores) => Scores) => {
    if (isCurrent(scope)) client.setQueryData(SCORES_KEY, (old?: Scores) => updater(old ?? EMPTY_SCORES));
  };
  const setUnsaved = (scope: string, updater: (u: Unsaved) => Unsaved) =>
    client.setQueryData(UNSAVED_KEY, (old?: Unsaved) => old?.scope === scope ? updater(old) : undefined);
  return {
    record: {
      mutationKey: WRITE_KEY,
      // record_answer ignores a duplicate request id, so an answer is never awarded twice.
      mutationFn: (a: RecordArgs) => {
        requireCurrent(a.scope);
        return api.recordAnswer(a.tech, a.isCorrect, a.source, a.difficulty, a.requestId);
      },
      onMutate: async (args: RecordArgs) => {
        requireCurrent(args.scope);
        await client.cancelQueries({ queryKey: SCORES_KEY });
        requireCurrent(args.scope);
        setUnsaved(args.scope, (u) => ({ ...u, answers: u.answers.filter((a) => a.requestId !== args.requestId) }));
        if (!args.retry) patch(args.scope, (s) => applyAnswer(s, args));
      },
      onError: (_error: unknown, args: RecordArgs) => setUnsaved(args.scope, (u) => ({ ...u, answers: [...u.answers, { ...args, retry: true }] })),
      onSettled: (_data: unknown, _error: unknown, args: RecordArgs) => {
        if (!isCurrent(args.scope)) return;
        client.invalidateQueries({ queryKey: ["accuracy-timeline"] });
        client.invalidateQueries({ queryKey: ["review-queue"] });
      },
    },
    // add_xp has no request id, so a failed bonus is reported but never retried: it may have landed.
    xp: {
      mutationKey: WRITE_KEY,
      mutationFn: (args: { points: number; scope: string }) => {
        requireCurrent(args.scope);
        return api.addXp(args.points);
      },
      onMutate: async (args: { points: number; scope: string }) => {
        requireCurrent(args.scope);
        await client.cancelQueries({ queryKey: SCORES_KEY });
        requireCurrent(args.scope);
        patch(args.scope, (s) => ({ ...s, xp: s.xp + args.points }));
      },
      onError: (_error: unknown, args: { points: number; scope: string }) => setUnsaved(args.scope, (u) => ({ ...u, bonusFailed: u.bonusFailed + 1 })),
    },
    // Resends failed answers and clears the bonus notice.
    retry: (unsaved: Unsaved, record: (args: RecordArgs) => void) => {
      if (unsaved.scope !== currentScope || !isCurrent(unsaved.scope)) return;
      unsaved.answers.filter((answer) => answer.scope === unsaved.scope).forEach(record);
      setUnsaved(unsaved.scope, (u) => ({ ...u, bonusFailed: 0 }));
    },
  };
}

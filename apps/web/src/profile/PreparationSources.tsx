import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "@grip/core/i18n";
import { fetchGithubTechSignals, githubUsernameFromUrl } from "@grip/core/githubTechs";
import type { PreparationRecord, User } from "@grip/core/api";
import * as api from "../lib/api";
import { colors } from "../lib/tokens";
import { miniBtn } from "../components/fieldStyles";
import { ErrorText } from "../components/ErrorText";
import { WorkspacePanel } from "../components/WorkspaceLayout";
import { Switch } from "../components/Switch";
import { profileQueryKeys } from "./queries";
import { profilePath } from "./routes.js";
import styles from "./Preparation.module.css";

type Props = {
  profile: User | null;
  preparation: PreparationRecord | null;
  catalogue: string[];
  githubConnected: boolean;
  linkPending: boolean;
  usagePending: boolean;
  onLinkGitHub: () => void;
  onUsageChange: (checked: boolean) => void;
  onEdit: () => void;
};

type Sync =
  | { phase: "idle" }
  | { phase: "syncing" }
  | { phase: "review"; suggestions: string[]; partial: boolean }
  | { phase: "error"; message: string };

// Accepting reviewed suggestions adds them to the stack; favourites are never sent.
function useAcceptGithubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saveGithubSignals,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.preparation }),
      ]),
  });
}

// GitHub: connection, usage and sync are separate. Sync only fetches suggestions to review.
export function PreparationSources({ profile, preparation, catalogue, githubConnected, linkPending, usagePending, onLinkGitHub, onUsageChange, onEdit }: Props) {
  const [sync, setSync] = useState<Sync>({ phase: "idle" });
  const [selected, setSelected] = useState<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  const accept = useAcceptGithubMutation();
  const queryClient = useQueryClient();
  const username = githubUsernameFromUrl(profile?.githubUrl);

  // Leaving Profile, or a different user/username, drops the in-flight scan and its result.
  useEffect(() => {
    setSync({ phase: "idle" });
    return () => controller.current?.abort();
  }, [username, profile?.id]);

  const runSync = async () => {
    if (sync.phase === "syncing" || !username) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setSync({ phase: "syncing" });
    try {
      const result = await fetchGithubTechSignals(username, catalogue, { signal: current.signal });
      // Records the successful fetch time only; nothing is accepted yet.
      await api.saveGithubSignals({ acceptedTechs: [], syncedAt: new Date().toISOString() });
      if (current.signal.aborted) return;
      const stack = new Set(profile?.goalTechs ?? []);
      const suggestions = result.techs.map((s) => s.tech).filter((tech) => !stack.has(tech));
      setSelected(suggestions);
      setSync({ phase: "review", suggestions, partial: result.scanned < result.total });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.preparation });
    } catch (e) {
      if (current.signal.aborted) return;
      setSync({ phase: "error", message: (e as Error).message });
    }
  };

  const acceptSelected = () =>
    accept.mutate({ acceptedTechs: selected, syncedAt: null }, { onSuccess: () => setSync({ phase: "idle" }) });

  const syncedAt = preparation?.githubSyncedAt ? new Date(preparation.githubSyncedAt).toLocaleString() : t("profile.sources.never");

  return (
    <WorkspacePanel style={{
        padding: 20,
        marginBottom: 16
      }}>
      <div className={styles.heading}>
        <h2>{t("profile.sources.title")}</h2>
      </div>
      <p className={styles.muted}>{t("profile.sources.sub")}</p>

      <div className={styles.row}>
        <div>
          <strong className={styles.value}>GitHub</strong>
          <p className={styles.muted}>
            {githubConnected ? (username ? `@${username}` : t("profile.sources.connected")) : t("profile.sources.notConnected")}
          </p>
          {githubConnected && <p className={styles.muted}>{t("profile.sources.lastSync", { time: syncedAt })}</p>}
        </div>
        {githubConnected ? (
          <button
            type="button"
            onClick={runSync}
            disabled={!username || sync.phase === "syncing"}
            aria-busy={sync.phase === "syncing"}
            style={miniBtn(colors.accentBright ?? "")}
          >
            {sync.phase === "syncing" ? t("profile.sources.syncing") : t("profile.sources.syncNow")}
          </button>
        ) : (
          <button type="button" onClick={onLinkGitHub} disabled={linkPending || !profile} style={miniBtn(colors.accentBright ?? "")}>
            {linkPending ? t("profile.githubOpening") : t("profile.githubConnectButton")}
          </button>
        )}
      </div>
      {githubConnected && (
        <div className={styles.inline} style={{
            alignItems: "center",
            justifyContent: "space-between"
          }}>
          <span className={styles.muted}>{t("profile.useGithubLabel")}</span>
          <Switch
            checked={!!profile?.useGithubTechsForPrep}
            disabled={usagePending}
            label={t("profile.useGithubLabel")}
            onChange={onUsageChange}
          />
        </div>
      )}
      {githubConnected && <p className={styles.muted}>{t("profile.sources.usageHint")}</p>}

      {sync.phase === "error" && (
        <ErrorText margin="10px 0 0">{t("profile.sources.syncFailed", { message: sync.message })}</ErrorText>
      )}
      {sync.phase === "review" && (
        <section aria-label={t("profile.sources.reviewTitle")} style={{ marginTop: 12 }}>
          <span className={styles.fieldLabel}>{t("profile.sources.reviewTitle")}</span>
          {sync.partial && <p className={styles.muted}>{t("profile.sources.partial")}</p>}
          {sync.suggestions.length === 0 ? (
            <p className={styles.muted}>{t("profile.sources.nothingNew")}</p>
          ) : (
            <div className={styles.chips} style={{ marginTop: 8 }}>
              {sync.suggestions.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  className={styles.chip}
                  aria-pressed={selected.includes(tech)}
                  onClick={() => setSelected((s) => (s.includes(tech) ? s.filter((x) => x !== tech) : [...s, tech]))}
                >
                  {tech}
                </button>
              ))}
            </div>
          )}
          <div className={styles.actions}>
            {sync.suggestions.length > 0 && (
              <button type="button" onClick={acceptSelected} disabled={!selected.length || accept.isPending} style={miniBtn(colors.accentBright ?? "")}>
                {t("profile.sources.accept")}
              </button>
            )}
            <button type="button" onClick={() => setSync({ phase: "idle" })} style={miniBtn(colors.textDim ?? "")}>
              {t("profile.sources.dismiss")}
            </button>
            {accept.error && <ErrorText>{(accept.error as Error).message}</ErrorText>}
          </div>
        </section>
      )}

      <div className={styles.row}>
        <div>
          <strong className={styles.value}>CV</strong>
          <p className={styles.muted}>
            {profile?.cvTechs?.length ? t("profile.sources.cvCount", { count: profile.cvTechs.length }) : t("profile.sources.cvNone")}
          </p>
        </div>
        <a
          href={profilePath("edit")}
          className={styles.link}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            onEdit();
          }}
        >
          {t("profile.sources.cvReview")}
        </a>
      </div>
    </WorkspacePanel>
  );
}

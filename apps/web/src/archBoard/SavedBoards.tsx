import { useState } from "react";
import { t } from "@grip/core/i18n";
import { colors } from "@grip/core/tokens";
import { useAuthUserQuery } from "../profile/queries";
import { useShareBoardMutation } from "./queries";
import type { AugmentedScenario, BoardSummary } from "./types";

const COPIED_RESET_MS = 1500;

const shareUrl = (token: string) => `${window.location.origin}/share/${token}`;

export function SavedBoards({
  activeBoardId,
  allScenarios,
  boards,
  onDelete,
  onLoad,
}: {
  activeBoardId: string | null;
  allScenarios: AugmentedScenario[];
  boards: BoardSummary[];
  onDelete: (id: string) => void;
  onLoad: (board: BoardSummary) => void;
}) {
  const shareMutation = useShareBoardMutation();
  // Demo (anonymous) users can't create public links; the database rejects it too.
  const isDemo = !!useAuthUserQuery().data?.is_anonymous;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);

  const copyLink = async (board: BoardSummary) => {
    if (!board.shareToken || !board.id) return;
    setCopyErrorId(null);
    try {
      await navigator.clipboard.writeText(shareUrl(board.shareToken));
      setCopiedId(board.id);
      window.setTimeout(() => setCopiedId((current) => (current === board.id ? null : current)), COPIED_RESET_MS);
    } catch {
      setCopyErrorId(board.id);
    }
  };

  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12 }}>
      {boards.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: colors.textFaint }}>{t("board.savedEmpty")}</p>
      ) : (
        boards.map((board) => {
          const boardScenario = allScenarios.find((item) => item.id === board.scenarioId);
          const active = board.id === activeBoardId;
          return (
            <div
              key={board.id}
              style={{
                minWidth: 220,
                padding: "10px 12px",
                background: colors.well,
                border: `1px solid ${active ? colors.accent : colors.border}`,
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.textBright,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {board.title}
              </span>
              <span style={{ fontSize: 10.5, color: colors.textFaint }}>
                {boardScenario?.name ?? board.scenarioId} · updated {new Date(board.updatedAt).toLocaleDateString()}
              </span>
              {copyErrorId === board.id && board.shareToken && (
                <p role="alert" style={{ margin: 0, fontSize: 11, color: colors.dangerBright }}>
                  Copy failed. Copy this link: <span style={{ userSelect: "all" }}>{shareUrl(board.shareToken)}</span>
                </p>
              )}
              {shareMutation.error && shareMutation.variables?.id === board.id && <p role="alert" style={{ margin: 0, fontSize: 11, color: colors.dangerBright }}>{shareMutation.error.message}</p>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                {board.shareToken ? (
                  <>
                    <button
                      onClick={() => copyLink(board)}
                      style={{
                        padding: "3px 10px",
                        background: "transparent",
                        border: `1px solid ${colors.success}60`,
                        borderRadius: 6,
                        color: colors.successBright,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {copiedId === board.id ? t("board.linkCopied") : t("board.copyLink")}
                    </button>
                    <button
                      onClick={() => board.id && shareMutation.mutate({ id: board.id, enable: false })}
                      style={{
                        padding: "3px 10px",
                        background: "transparent",
                        border: `1px solid ${colors.border}`,
                        borderRadius: 6,
                        color: colors.textDim,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {t("board.unshare")}
                    </button>
                  </>
                ) : isDemo ? (
                  <span style={{ padding: "3px 4px", color: colors.textFaint, fontSize: 11 }}>{t("demo.signInToShare")}</span>
                ) : (
                  <button
                    onClick={() => board.id && shareMutation.mutate({ id: board.id, enable: true })}
                    disabled={shareMutation.isPending}
                    style={{
                      padding: "3px 10px",
                      background: "transparent",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 6,
                      color: colors.textDim,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t("board.share")}
                  </button>
                )}
                <button
                  onClick={() => onLoad(board)}
                  style={{
                    padding: "3px 10px",
                    background: "transparent",
                    border: `1px solid ${colors.accent}60`,
                    borderRadius: 6,
                    color: colors.accentBright,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("common.load")}
                </button>
                <button
                  onClick={() => board.id && window.confirm(t("board.deleteMessage", { title: board.title })) && onDelete(board.id)}
                  style={{
                    padding: "3px 10px",
                    background: "transparent",
                    border: `1px solid ${colors.danger}50`,
                    borderRadius: 6,
                    color: colors.dangerBright,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

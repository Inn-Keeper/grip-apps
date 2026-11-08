import { useEffect } from "react";
import { t } from "@grip/core/i18n";
import { alpha, colors, font, tints } from "../lib/tokens";
import { miniBtn } from "../components/fieldStyles";
import type { SaveStatus } from "./useScores";

// Unsaved answers, a failed bonus or a failed score load, beside the active task.
export function ProgressSaveStatus({ status }: { status: SaveStatus }) {
  const { pending, failed, bonusFailed, loadFailed, retry } = status;
  const atRisk = pending > 0 || failed > 0;

  // Failed answers live only in this session, so a reload asks first.
  useEffect(() => {
    if (!atRisk) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [atRisk]);

  if (!failed && !bonusFailed && !loadFailed) return null;
  return (
    <div role="alert" style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        padding: "10px 14px",
        background: tints.dangerSoft,
        border: `1px solid ${alpha(colors.danger, 0.38)}`,
        borderRadius: 8,
        color: colors.dangerBright,
        fontSize: font.size.body
      }}>
      <div style={{
          flex: "1 1 260px",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}>
        {loadFailed && <span>{t("prep.scoresLoadError")}</span>}
        {failed > 0 && <span>{t("prep.progressUnsaved", { count: failed })}</span>}
        {bonusFailed > 0 && <span>{t("prep.bonusUnsaved")}</span>}
      </div>
      {failed > 0 && (
        <button type="button" onClick={retry} disabled={pending > 0} style={miniBtn(colors.dangerBright ?? "")}>
          {pending > 0 ? t("prep.progressSaving") : t("prep.progressRetry")}
        </button>
      )}
    </div>
  );
}

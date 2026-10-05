import { useEffect, useRef, useState } from "react";
import { t } from "@grip/core/i18n";
import { importRowToContact, importSummary, markDuplicates } from "@grip/core/ledgerImport";
import { colors, font, radius, space, tints } from "@grip/core/tokens";
import { textareaFieldStyle } from "../../components/fieldStyles";
import { ledgerImport } from "../../lib/api";
import { useImportContactsMutation } from "../queries";
import type { Contact } from "../types";
import { ReviewList, type ReviewRow } from "./ReviewList";

type Step = "upload" | "reading" | "review" | "confirm";
const MAX_BYTES = 1_000_000;
const ACCEPTED = /\.(docx|md)$/i;

// Server codes the user can act on; anything else gets the generic retry message.
const ERROR_KEYS: Record<string, Parameters<typeof t>[0]> = {
  unsupported_file: "quest.importWrongType",
  file_too_large: "quest.importTooBig",
  ledger_too_long: "quest.importTooLong",
  provider_quota_exhausted: "quest.importBusy",
  provider_limited: "quest.importBusy",
};

const button = (primary: boolean) => ({
  padding: "8px 16px",
  background: primary ? colors.accent : "transparent",
  border: primary ? "none" : `1px solid ${colors.borderSoft}`,
  borderRadius: 8,
  color: primary ? colors.onAccent : colors.textDim,
  fontSize: font.size.body,
  fontWeight: 600,
  cursor: "pointer",
});

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // A data URL is "data:<type>;base64,<payload>"; the service wants the payload.
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Quest import: upload or paste, AI reads it, the user reviews and confirms. Nothing is
// saved before the confirm step.
export function ImportModal({ contacts, onClose, onImported }: { contacts: Contact[]; onClose: () => void; onImported: (count: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [unplaced, setUnplaced] = useState<string[]>([]);
  const save = useImportContactsMutation();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  // Each step announces itself by moving focus to its heading.
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const close = () => {
    if (save.isPending) return;
    abort.current?.abort();
    onClose();
  };

  const parse = async (payload: { text: string } | { filename: string; content_base64: string }) => {
    if (!ledgerImport) return;
    setError(null);
    setStep("reading");
    abort.current = new AbortController();
    try {
      const result = await ledgerImport.parseLedger(payload, { signal: abort.current.signal });
      const parsed: ReviewRow[] = result.rows.map((row: { source: string; warnings: string[] }) => ({
        ...importRowToContact(row, crypto.randomUUID()),
        included: true,
        source: row.source,
        warnings: row.warnings,
      }));
      const duplicates = markDuplicates(parsed, contacts);
      setRows(parsed.map((row) => duplicates.has(row.id) ? { ...row, included: false, warnings: [...row.warnings, "duplicate"] } : row));
      setUnplaced(result.unplaced);
      setStep("review");
    } catch (cause) {
      const failure = cause as Error & { code?: string };
      if (failure.name === "AbortError") return;
      setError(t(ERROR_KEYS[failure.code ?? ""] ?? "quest.importFailed"));
      setStep("upload");
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.test(file.name)) return setError(t("quest.importWrongType"));
    if (file.size > MAX_BYTES) return setError(t("quest.importTooBig"));
    parse({ filename: file.name, content_base64: await readBase64(file) });
  };

  const confirm = () => {
    const chosen = rows.filter((row) => row.included);
    // Same client ids on every retry, so a resend after a timeout cannot duplicate.
    save.mutate(chosen.map(({ included: _i, source: _s, warnings: _w, ...contact }) => contact), {
      onSuccess: () => {
        onImported(chosen.length);
        onClose();
      },
    });
  };

  const summary = importSummary(rows);
  const headingText = {
    upload: t("quest.importTitle"),
    reading: t("quest.importReading"),
    review: rows.length ? t("quest.importFound", { count: rows.length }) : t("quest.importNone"),
    confirm: t("quest.importConfirmTitle"),
  }[step];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="import-heading"
      onCancel={(e) => { e.preventDefault(); close(); }}
      // margin auto: the global reset removes the browser's centering of modal dialogs.
      style={{ margin: "auto", width: "min(92vw, 760px)", maxHeight: "86vh", padding: space.xl, borderRadius: radius.lg, border: `1px solid ${colors.borderSoft}`, background: colors.surface, color: colors.text }}
    >
      <style>{"dialog::backdrop{background:" + tints.modalScrim + "}"}</style>
      <h2 id="import-heading" ref={heading} tabIndex={-1} style={{ margin: 0, fontSize: font.size.titleLg, fontWeight: 800, color: colors.textBright, outline: "none" }}>
        {headingText}
      </h2>

      {step === "upload" && (
        <div style={{ display: "flex", flexDirection: "column", gap: space.md, marginTop: space.md }}>
          <p style={{ margin: 0, color: colors.textDim, fontSize: font.size.body, lineHeight: 1.5 }}>{t("quest.importIntro")}</p>
          {pasting ? (
            <label style={{ display: "flex", flexDirection: "column", gap: space.xs }}>
              <span style={{ fontSize: font.size.label, fontWeight: 700, color: colors.textDim }}>{t("quest.importPasteLabel")}</span>
              <textarea style={{ ...textareaFieldStyle, minHeight: 180 }} value={text} onChange={(e) => setText(e.target.value)} />
            </label>
          ) : (
            <label style={{ display: "flex", flexDirection: "column", gap: space.xs, padding: space.lg, border: `1px dashed ${colors.border}`, borderRadius: radius.md, cursor: "pointer" }}>
              <span style={{ color: colors.accentBright, fontWeight: 700 }}>{t("quest.importChoose")}</span>
              <span style={{ color: colors.textFaint, fontSize: font.size.label }}>{t("quest.importLimits")}</span>
              <input type="file" accept=".docx,.md" onChange={(e) => onFile(e.target.files?.[0])} style={{ fontSize: font.size.small, color: colors.textDim }} />
            </label>
          )}
          <p style={{ margin: 0, color: colors.textFaint, fontSize: font.size.label, lineHeight: 1.5 }}>{t("quest.importPrivacy")}</p>
          {error && <p role="alert" style={{ margin: 0, color: colors.dangerBright, fontSize: font.size.small }}>{error}</p>}
          <div style={{ display: "flex", gap: space.sm, justifyContent: "space-between" }}>
            <button type="button" onClick={() => { setPasting(!pasting); setError(null); }} style={{ ...button(false), border: "none", color: colors.accentBright }}>
              {pasting ? t("quest.importChoose") : t("quest.importPasteToggle")}
            </button>
            <span style={{ display: "flex", gap: space.sm }}>
              <button type="button" onClick={close} style={button(false)}>{t("common.cancel")}</button>
              {pasting && <button type="button" disabled={!text.trim()} onClick={() => parse({ text })} style={{ ...button(true), opacity: text.trim() ? 1 : 0.5 }}>{t("quest.importRead")}</button>}
            </span>
          </div>
        </div>
      )}

      {step === "reading" && (
        <div style={{ marginTop: space.md }}>
          <p role="status" style={{ margin: 0, color: colors.textDim }}>{t("quest.importReadingSub")}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: space.lg }}>
            <button type="button" onClick={() => { abort.current?.abort(); setStep("upload"); }} style={button(false)}>{t("common.cancel")}</button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div style={{ marginTop: space.md, display: "flex", flexDirection: "column", gap: space.md }}>
          <ReviewList rows={rows} onChange={(id, patch) => setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row))} />
          {unplaced.length > 0 && (
            <details style={{ fontSize: font.size.small, color: colors.textDim }}>
              <summary style={{ cursor: "pointer" }}>{t("quest.importUnplaced", { count: unplaced.length })}</summary>
              <ul style={{ margin: `${space.xs}px 0 0`, paddingLeft: space.lg }}>{unplaced.map((line, i) => <li key={i}>{line}</li>)}</ul>
            </details>
          )}
          <div style={{ display: "flex", gap: space.sm, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setStep("upload")} style={button(false)}>{t("quest.importBack")}</button>
            <button type="button" disabled={summary.importing === 0} onClick={() => setStep("confirm")} style={{ ...button(true), opacity: summary.importing ? 1 : 0.5 }}>
              {t("quest.importContinue", { count: summary.importing })}
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div style={{ marginTop: space.md }}>
          <ul style={{ margin: 0, paddingLeft: space.lg, color: colors.textDim, lineHeight: 1.7 }}>
            <li>{t("quest.importConfirmNew", { count: summary.importing })}</li>
            {summary.missingFollowUp > 0 && <li>{t("quest.importConfirmMissing", { count: summary.missingFollowUp })}</li>}
            {summary.skipped > 0 && <li>{t("quest.importConfirmSkipped", { count: summary.skipped })}</li>}
          </ul>
          {save.isError && <p role="alert" style={{ margin: `${space.md}px 0 0`, color: colors.dangerBright, fontSize: font.size.small }}>{t("quest.importSaveFailed")}</p>}
          <div style={{ display: "flex", gap: space.sm, justifyContent: "flex-end", marginTop: space.lg }}>
            <button type="button" disabled={save.isPending} onClick={() => setStep("review")} style={button(false)}>{t("common.cancel")}</button>
            <button type="button" disabled={save.isPending} onClick={confirm} style={{ ...button(true), opacity: save.isPending ? 0.6 : 1 }}>
              {save.isPending ? t("quest.importSaving") : t("quest.importContinue", { count: summary.importing })}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { t } from "@grip/core/i18n";
import { importSummary } from "@grip/core/ledgerImport";
import {
  hasInvalidImportRows,
  importErrorKey,
  IMPORT_FILE_TYPES,
  IMPORT_MAX_BYTES,
  readImport,
  reviewImportRows,
  type ReviewRow,
} from "@grip/core/importReview";
import { colors, font, radius, space } from "@grip/core/tokens";
import { srOnly, textareaFieldStyle } from "../../components/fieldStyles";
import { ledgerImport, postingReader } from "../../lib/api";
import { useImportContactsMutation } from "../queries";
import type { Contact } from "../types";
import { ReviewList } from "./ReviewList";
import styles from "./ImportModal.module.css";

type Step = "upload" | "reading" | "review" | "confirm";
const theme = {
  "--import-secondary": colors.textDim,
  "--import-error": colors.dangerBright,
  "--import-xs": `${space.xs}px`,
  "--import-sm": `${space.sm}px`,
  "--import-md": `${space.md}px`,
  "--import-lg": `${space.lg}px`,
  "--import-xl": `${space.xl}px`,
  "--import-body": `${font.size.body}px`,
  "--import-small": `${font.size.small}px`,
} as CSSProperties;
const button = (primary: boolean) => ({
  minHeight: 40,
  padding: `${space.sm}px ${space.lg}px`,
  background: primary ? colors.accent : "transparent",
  border: `1px solid ${primary ? colors.accent : colors.borderSoft}`,
  borderRadius: radius.sm,
  color: primary ? colors.onAccent : colors.textDim,
  fontSize: font.size.body,
  fontWeight: 600,
  cursor: "pointer",
});

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ImportModal({
  contacts,
  onClose,
  onImported,
}: {
  contacts: Contact[];
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [unplaced, setUnplaced] = useState<string[]>([]);
  const [readLinks, setReadLinks] = useState(true);
  const [readingLinks, setReadingLinks] = useState(false);
  const save = useImportContactsMutation();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      abort.current?.abort();
      opener?.focus();
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const close = () => {
    if (save.isPending) return;
    abort.current?.abort();
    onClose();
  };

  const parse = async (input: { text: string } | File) => {
    if (!ledgerImport) return;
    if (input instanceof File) {
      if (!IMPORT_FILE_TYPES.test(input.name)) return setError(t("quest.importWrongType"));
      if (input.size > IMPORT_MAX_BYTES) return setError(t("quest.importTooBig"));
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setError(null);
    setReadingLinks(false);
    setStep("reading");
    try {
      const payload = input instanceof File ? { filename: input.name, content_base64: await readBase64(input) } : input;
      if (controller.signal.aborted) return;
      const result = await readImport({
        ledger: ledgerImport,
        posting: postingReader,
        payload,
        contacts,
        readLinks,
        signal: controller.signal,
        newId: () => crypto.randomUUID(),
        onReadingLinks: () => setReadingLinks(true),
      });
      if (controller.signal.aborted) return;
      setRows(result.rows);
      setUnplaced(result.unplaced);
      setStep("review");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(t(importErrorKey(cause as Error & { code?: string })));
      setStep("upload");
    }
  };

  const reviewed = reviewImportRows(rows, contacts);
  const summary = importSummary(reviewed);
  const invalid = hasInvalidImportRows(reviewed);
  const confirm = () => {
    if (save.isPending || invalid || !summary.importing) return;
    const chosen = reviewed.filter((row) => row.included);
    // Stable ids survive failed saves, making retry safe after a lost response.
    save.mutate(chosen, {
      onSuccess: () => {
        onImported(chosen.length);
        onClose();
      },
    });
  };
  const headingText = {
    upload: t("quest.importTitle"),
    reading: t("quest.importReading"),
    review: t("quest.importReviewTitle"),
    confirm: t("quest.importConfirmTitle"),
  }[step];

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="import-heading"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      style={{
        ...theme,
        background: colors.surface,
        color: colors.text,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.lg,
      }}
    >
      <div className={styles.layout}>
        <header className={styles.header}>
          <h2
            id="import-heading"
            ref={heading}
            tabIndex={-1}
            style={{
              margin: 0,
              fontSize: font.size.heading,
              fontWeight: 700,
              color: colors.textBright,
              outline: "none",
            }}
          >
            {headingText}
          </h2>
          {step !== "reading" && (
            <button
              type="button"
              onClick={close}
              disabled={save.isPending}
              style={button(false)}
            >
              {t("quest.importClose")}
            </button>
          )}
        </header>
        <div
          key={step}
          className={styles.body}
        >
          {step === "upload" && (
            <>
              <p>{t("quest.importIntro")}</p>
              {pasting ? (
                <label className={styles.field}>
                  <span>{t("quest.importPasteLabel")}</span>
                  <textarea
                    style={{
                      ...textareaFieldStyle,
                      minHeight: 180
                    }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </label>
              ) : (
                <div
                  className={styles.fileChoice}
                  style={{
                    background: colors.well,
                    borderRadius: radius.sm
                  }}
                >
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".docx,.md"
                    tabIndex={-1}
                    aria-hidden="true"
                    style={srOnly}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void parse(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    style={button(true)}
                  >
                    {t("quest.importChoose")}
                  </button>
                  <span>{t("quest.importLimits")}</span>
                </div>
              )}
              <button
                className={styles.textButton}
                type="button"
                onClick={() => {
                  setPasting(!pasting);
                  setError(null);
                }}
                style={{ color: colors.accentBright }}
              >
                {pasting ? t("quest.importChoose") : t("quest.importPasteToggle")}
              </button>
              {postingReader && (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={readLinks}
                    onChange={(e) => setReadLinks(e.target.checked)}
                  />
                  {t("quest.importReadLinks")}
                </label>
              )}
              <p className={styles.hint}>{t("quest.importPrivacy")}</p>
              {error && (
                <p
                  role="alert"
                  style={{ color: colors.dangerBright }}
                >
                  {error}
                </p>
              )}
            </>
          )}
          {step === "reading" && (
            <div
              className={styles.processing}
              role="status"
            >
              <span
                className={styles.spinner}
                aria-hidden="true"
              />
              <p>{t(readingLinks ? "quest.importReadingLinks" : "quest.importReadingSub")}</p>
            </div>
          )}
          {step === "review" && (
            <>
              <p>{rows.length ? t("quest.importFound", { count: rows.length }) : t("quest.importNone")}</p>
              <ReviewList
                rows={reviewed}
                onChange={(id, patch) =>
                  setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
                }
              />
              {unplaced.length > 0 && (
                <details>
                  <summary>{t("quest.importUnplaced", { count: unplaced.length })}</summary>
                  <ul>
                    {unplaced.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
          {step === "confirm" && (
            <>
              <p style={{
                  fontSize: font.size.title,
                  color: colors.textBright
                }}>
                {t("quest.importConfirmNew", { count: summary.importing })}
              </p>
              <ul className={styles.summary}>
                {summary.missingFollowUp > 0 && (
                  <li>{t("quest.importConfirmMissing", { count: summary.missingFollowUp })}</li>
                )}
                {summary.skipped > 0 && <li>{t("quest.importConfirmSkipped", { count: summary.skipped })}</li>}
                {unplaced.length > 0 && <li>{t("quest.importConfirmUnplaced", { count: unplaced.length })}</li>}
              </ul>
              <p>{t("quest.importConfirmHelp")}</p>
              {save.isError && (
                <p
                  role="alert"
                  style={{ color: colors.dangerBright }}
                >
                  {t("quest.importSaveFailed")}
                </p>
              )}
              <span
                role="status"
                style={srOnly}
              >
                {save.isPending ? t("quest.importSaving") : ""}
              </span>
            </>
          )}
        </div>
        <footer
          className={styles.footer}
          style={{ borderTop: `1px solid ${colors.borderSoft}` }}
        >
          {invalid && (step === "review" || step === "confirm") && (
            <p
              role="status"
              style={{ color: colors.dangerBright }}
            >
              {t("quest.importFixErrors")}
            </p>
          )}
          <div className={styles.actions}>
            {step === "upload" && (
              <>
                <button
                  type="button"
                  onClick={close}
                  style={button(false)}
                >
                  {t("common.cancel")}
                </button>
                {pasting && (
                  <button
                    type="button"
                    disabled={!text.trim()}
                    onClick={() => void parse({ text })}
                    style={button(true)}
                  >
                    {t("quest.importRead")}
                  </button>
                )}
              </>
            )}
            {step === "reading" && (
              <button
                type="button"
                onClick={() => {
                  abort.current?.abort();
                  setStep("upload");
                }}
                style={button(false)}
              >
                {t("common.cancel")}
              </button>
            )}
            {step === "review" && (
              <>
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  style={button(false)}
                >
                  {t("quest.importBack")}
                </button>
                <button
                  type="button"
                  disabled={!summary.importing || invalid}
                  onClick={() => setStep("confirm")}
                  style={button(true)}
                >
                  {t("quest.importReviewAction", { count: summary.importing })}
                </button>
              </>
            )}
            {step === "confirm" && (
              <>
                <button
                  type="button"
                  disabled={save.isPending}
                  onClick={() => setStep("review")}
                  style={button(false)}
                >
                  {t("quest.importBackToReview")}
                </button>
                <button
                  type="button"
                  disabled={save.isPending || invalid || !summary.importing}
                  onClick={confirm}
                  style={button(true)}
                >
                  {save.isPending ? t("quest.importSaving") : t("quest.importContinue", { count: summary.importing })}
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </dialog>
  );
}

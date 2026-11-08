import { useEffect, useId, useRef } from "react";
import { t } from "@grip/core/i18n";
import { colors, font, radius, space } from "../lib/tokens";
import styles from "./ConfirmDialog.module.css";

// In-app replacement for window.confirm: native <dialog> for focus trapping and Escape,
// styled like the app. Focus starts on Cancel, so Enter never confirms a destructive action.
export function ConfirmDialog({ open, title, message, confirmLabel, danger = false, onConfirm, onCancel }: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      cancel.current?.focus();
    } else if (!open && el.open) el.close();
  }, [open]);

  const tone = danger ? colors.dangerBright : colors.accent;
  const button = {
    minHeight: 40,
    padding: `${space.sm}px ${space.lg}px`,
    borderRadius: radius.sm,
    fontSize: font.size.body,
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      style={{
        background: colors.surface,
        color: colors.text,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.md
      }}
    >
      <h2 id={titleId} style={{
          margin: 0,
          fontSize: font.size.heading,
          fontWeight: 800,
          color: colors.textBright
        }}>{title}</h2>
      <p id={messageId} style={{
          margin: `${space.md}px 0 ${space.xl}px`,
          fontSize: font.size.body,
          lineHeight: 1.6,
          color: colors.textDim
        }}>{message}</p>
      <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: space.sm,
          flexWrap: "wrap"
        }}>
        <button ref={cancel} type="button" onClick={onCancel} style={{
            ...button,
            background: "transparent",
            border: `1px solid ${colors.borderSoft}`,
            color: colors.text
          }}>
          {t("common.cancel")}
        </button>
        <button type="button" onClick={onConfirm} style={{
            ...button,
            background: danger ? "transparent" : tone,
            border: `1px solid ${tone}`,
            color: danger ? tone : colors.onAccent
          }}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

import type { ReactNode } from "react";
import { t } from "@grip/core/i18n";
import { colors, font, shadow } from "@grip/core/tokens";
import { BrandIcon } from "./BrandIcon";
import hover from "./HoverCard.module.css";

type NextUpShellProps = {
  title: string;
  sub: string;
  // Tone colour: the one light edge this card is allowed (rule 22).
  tone: string;
  actionLabel: string;
  actionIcon?: string;
  onAction: () => void;
  // busy: something this card started is loading; disabled: anything is loading.
  busy?: boolean;
  disabled?: boolean;
  // "or …" alternatives, rendered with NextUpLink.
  links?: ReactNode;
  error?: string | null;
};

// A screen's one main action (rule 1): a suggestion, one button, and quiet alternatives beneath.
export function NextUpShell({ title, sub, tone, actionLabel, actionIcon = "drill", onAction, busy = false, disabled = false, links, error }: NextUpShellProps) {
  return (
    <section
      aria-label={t("nextUp.label")}
      className={hover.hoverCard}
      style={{
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16, padding: "14px 16px",
        background: `linear-gradient(135deg, ${tone}1A, ${colors.surface})`,
        border: `1px solid ${tone}60`, borderRadius: 12, boxShadow: shadow.card,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: "1 1 260px" }}>
        <span style={{ fontSize: font.size.label, fontWeight: 800, letterSpacing: "0.08em", color: tone, textTransform: "uppercase" }}>
          {t("nextUp.label")}
        </span>
        <span style={{ fontSize: font.size.bodyLg, fontWeight: 800, color: colors.textBright }}>{title}</span>
        <span style={{ fontSize: font.size.small, color: colors.textDim }}>{sub}</span>
        {links && (
          <span style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4, fontSize: font.size.small, color: colors.textFaint }}>
            {links}
          </span>
        )}
        {error && (
          <span role="alert" style={{ marginTop: 4, fontSize: font.size.small, color: colors.warningBright }}>{error}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        aria-busy={busy}
        style={{
          display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
          background: tone, border: "none", borderRadius: 9, color: colors.onAccent,
          fontSize: font.size.body, fontWeight: 800, cursor: busy ? "wait" : disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
        }}
      >
        <BrandIcon name={actionIcon} color={colors.onAccent} size={14} />
        {busy ? t("common.loading") : actionLabel}
      </button>
    </section>
  );
}

// An "or …" alternative under the main action.
export function NextUpLink({ label, onClick, disabled = false, muted = false, withOr = true }: { label: string; onClick: () => void; disabled?: boolean; muted?: boolean; withOr?: boolean }) {
  const button = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: "transparent", border: "none", padding: 0, color: muted ? colors.textFaint : colors.accentBright,
        fontSize: font.size.small, fontWeight: 600, cursor: disabled ? "default" : "pointer", textDecoration: "underline",
      }}
    >
      {label}
    </button>
  );
  return withOr ? <span>{t("nextUp.or")} {button}</span> : button;
}

import { ROUND_MINUTES } from "@grip/core/designTimer";
import { t } from "@grip/core/i18n";
import { colors, font } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";

// Off by default: most sessions are not timed, and a clock in the rail implies you
// ought to be timing yourself. Offered as one quiet line at the first step instead.
export function TimerOffer({ onStart }: { onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px",
        background: "transparent", border: `1px dashed ${colors.borderSoft}`, borderRadius: 8,
        color: colors.textDim, textAlign: "left", cursor: "pointer",
      }}
    >
      <BrandIcon name="spark" color={colors.textFaint} size={14} />
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: font.size.small, fontWeight: 700, color: colors.textDim }}>{t("timer.offer")}</span>
        <span style={{ fontSize: font.size.label, color: colors.textFaint }}>{t("timer.offerHint", { minutes: ROUND_MINUTES })}</span>
      </span>
    </button>
  );
}

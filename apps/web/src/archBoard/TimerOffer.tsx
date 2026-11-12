import { colors, font } from "../lib/tokens";
import { BrandIcon } from "../components/BrandIcon";

// Off by default: most sessions are not timed, and a clock in the rail implies you
// ought to be timing yourself. Offered as one quiet line at the first step instead.
export function TimerOffer({ title, hint, onStart }: { title: string; hint: string; onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "10px 14px",
        background: "transparent",
        border: `1px dashed ${colors.borderSoft}`,
        borderRadius: 8,
        color: colors.textDim,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <BrandIcon name="spark" color={colors.textFaint} size={14} />
      <span style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0
        }}>
        <span style={{
            fontSize: font.size.small,
            fontWeight: 700,
            color: colors.textDim
          }}>{title}</span>
        <span style={{
            fontSize: font.size.label,
            color: colors.textFaint
          }}>{hint}</span>
      </span>
    </button>
  );
}

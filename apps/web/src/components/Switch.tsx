import { alpha, colors } from "../lib/tokens";
import styles from "./Switch.module.css";

// The app's one on/off control (Profile connections, Poe, Prep's Auto-next): a button with
// role="switch", so it reads as on/off and toggles with Space/Enter. 48×28 clears the 24px tap minimum.
export function Switch({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={styles.control}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        padding: 3,
        flex: "0 0 auto",
        borderRadius: 999,
        border: `1px solid ${checked ? colors.accent : colors.borderSoft}`,
        background: checked ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentBright})` : colors.bgDeep,
        boxShadow: checked
          ? `0 0 0 3px ${alpha(colors.accent, 0.12)}, 0 8px 18px ${alpha(colors.accent, 0.13)}`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className={styles.thumb}
        aria-hidden="true"
        style={{
          display: "block",
          width: 20,
          height: 20,
          borderRadius: 999,
          background: checked ? colors.onAccent : colors.textFaint,
          boxShadow: checked ? "0 4px 12px rgba(0,0,0,0.28)" : "0 3px 9px rgba(0,0,0,0.35)",
          transform: checked ? "translateX(20px)" : "translateX(0)",
        }}
      />
    </button>
  );
}



export { Field } from "../components/shared";

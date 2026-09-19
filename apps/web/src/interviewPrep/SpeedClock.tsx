import { useEffect, useState, type CSSProperties } from "react";
import { SPEED_LIMIT_MS, SPEED_MULTIPLIER } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, font, tints } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import styles from "./InterviewPrep.module.css";

// The clock shows whole seconds; a 250ms tick keeps each change close to the real second.
const TICK_MS = 250;
// The last 10s turn amber and pulse: the bonus is about to go.
const URGENT_MS = 10_000;

// Thunderstorm countdown. The parent keys it per question, so each one starts fresh.
export function SpeedClock({ shownAt }: { shownAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  const remainingMs = Math.max(0, SPEED_LIMIT_MS - (now - shownAt));
  const timeUp = remainingMs === 0;
  const urgent = !timeUp && remainingMs <= URGENT_MS;

  useEffect(() => {
    if (timeUp) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [timeUp]);

  const seconds = Math.ceil(remainingMs / 1000);
  const tone = timeUp ? colors.textFaint : urgent ? colors.warningBright : colors.accentBright;

  return (
    // Screen readers hear "Time's up" once, not a tick every second.
    <span
      role="status"
      className={urgent ? styles.clockUrgent : undefined}
      title={t("prep.speedHint", { seconds: SPEED_LIMIT_MS / 1000, multiplier: SPEED_MULTIPLIER })}
      style={{
        "--clock-glow": `${colors.warning}80`,
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 11px", borderRadius: 999,
        background: timeUp ? "transparent" : urgent ? tints.warningSoft : `${colors.accent}1A`,
        border: `1px solid ${timeUp ? colors.borderSoft : urgent ? `${colors.warning}80` : `${colors.accent}55`}`,
        color: tone, fontSize: font.size.bodyLg, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1,
        transition: "background 200ms ease, border-color 200ms ease, color 200ms ease",
      } as CSSProperties}
    >
      <BrandIcon name="clock" color={tone} size={15} />
      {timeUp ? (
        <span style={{ fontSize: font.size.small, fontWeight: 700 }}>{t("prep.timesUp")}</span>
      ) : (
        // Keyed by the second, so the pop replays on every tick while urgent.
        <span key={seconds} className={styles.clockDigits} aria-hidden="true">0:{String(seconds).padStart(2, "0")}</span>
      )}
    </span>
  );
}

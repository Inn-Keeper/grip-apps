import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SPEED_LIMIT_MS, SPEED_MULTIPLIER } from "@grip/core/difficulty";
import { t } from "@grip/core/i18n";
import { colors, tints } from "@/theme";
import { BrandIcon } from "@/components/BrandIcon";

// The clock shows whole seconds; a 250ms tick keeps each change close to the real second.
const TICK_MS = 250;
// The last 10s turn amber: the bonus is about to go.
const URGENT_MS = 10_000;

// Thunderstorm countdown, the twin of web's SpeedClock. The parent keys it per question.
export function SpeedClock({ shownAt }: { shownAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  const remainingMs = Math.max(0, SPEED_LIMIT_MS - (now - shownAt));
  const timeUp = remainingMs === 0;
  const urgent = !timeUp && remainingMs <= URGENT_MS;

  useEffect(() => {
    if (timeUp) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [timeUp]);

  const seconds = Math.ceil(remainingMs / 1000);
  const tone = timeUp ? colors.textFaint : urgent ? colors.warningBright : colors.accentBright;

  return (
    <View
      accessibilityRole="timer"
      accessibilityLabel={timeUp ? t("prep.timesUp") : t("prep.speedHint", { seconds: SPEED_LIMIT_MS / 1000, multiplier: SPEED_MULTIPLIER })}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: timeUp ? colors.border : urgent ? `${colors.warning}80` : `${colors.accent}55`,
        backgroundColor: timeUp ? "transparent" : urgent ? tints.warningSoft : `${colors.accent}1A`,
      }}
    >
      <BrandIcon name="spark" color={tone} size={12} />
      <Text style={{ fontSize: 12, fontWeight: "800", color: tone, fontVariant: ["tabular-nums"] }}>
        {timeUp ? t("prep.timesUp") : `0:${String(seconds).padStart(2, "0")}`}
      </Text>
    </View>
  );
}

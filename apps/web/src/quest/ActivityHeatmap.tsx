import { useState } from "react";
import { activityByDay, activityLevel } from "@grip/core/activity";
import { getLocale, t } from "@grip/core/i18n";
import { colors, font, layout } from "@grip/core/tokens";
import { BrandIcon } from "../components/BrandIcon";
import { WorkspacePanel, WorkspaceTitle } from "../components/WorkspaceLayout";

const WEEKS = 26;
// Level 0 is the empty well; 1 to 4 ramp the accent up to its bright tone.
const LEVEL_COLORS = [colors.well, `${colors.accent}40`, `${colors.accent}70`, `${colors.accent}A0`, colors.accentBright];
const LABELED_WEEKDAYS = new Set([0, 2, 4]); // Mon, Wed, Fri
const toDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
};

const muted = { margin: 0, color: colors.textFaint, fontSize: font.size.small };

// Quest right rail: how often the pipeline moved, per day, over the last 26 weeks.
export function ActivityHeatmap({ statusEvents, loading, error }: {
  statusEvents: { createdAt: string }[];
  loading: boolean;
  error: Error | null;
}) {
  const [showDays, setShowDays] = useState(false);
  const locale = getLocale();
  const grid = activityByDay(statusEvents, new Date(), WEEKS);
  const days = grid.flat().filter((day): day is { date: string; count: number } => day !== null);
  const active = days.filter((day) => day.count > 0);
  const max = Math.max(0, ...days.map((day) => day.count));
  const shortDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const month = new Intl.DateTimeFormat(locale, { month: "short" });
  const ready = !loading && !error;

  // A month label sits under the week holding the month's first Monday, so a partial
  // month at the left edge stays unlabeled instead of crowding the next one. The last
  // two columns have no room for a label to run into, so they get none.
  const monthLabels = grid.map((week, index) => {
    const start = week[0];
    const fits = index < WEEKS - 2;
    return start && fits && toDate(start.date).getDate() <= 7 ? month.format(toDate(start.date)) : "";
  });

  return (
    <WorkspacePanel>
      <WorkspaceTitle
        icon={<BrandIcon name="calendar" color={colors.accentBright} size={17} />}
        title={t("quest.activityTitle")}
        right={ready && <span style={{ color: colors.textDim, fontSize: font.size.label, fontWeight: 700 }}>{t("quest.activityDays", { count: active.length })}</span>}
      />
      {/* Capped at the widest rail so the grid keeps its size when the rail stacks under the pipeline. */}
      <div style={{ marginTop: 14, maxWidth: layout.workspaceRightRailMax }}>
        {loading && <p style={muted}>{t("quest.activityLoading")}</p>}
        {error && !loading && <p style={{ ...muted, color: colors.dangerBright }}>{t("quest.activityError")}</p>}
        {ready && (
          <>
            <div
              role="img"
              aria-label={t("quest.activitySummary", { count: active.length, weeks: WEEKS })}
              style={{ display: "grid", gridTemplateColumns: `auto repeat(${WEEKS}, 1fr)`, gap: 2, alignItems: "center" }}
            >
              {Array.from({ length: 7 }, (_, row) => [
                <span key={`label-${row}`} aria-hidden style={{ color: colors.textFaint, fontSize: font.size.micro, paddingRight: 4, lineHeight: 1 }}>
                  {LABELED_WEEKDAYS.has(row) ? weekday.format(new Date(2026, 0, 5 + row)) : ""}
                </span>,
                ...grid.map((week, column) => {
                  const day = week[row];
                  return (
                    <span
                      key={`${column}-${row}`}
                      title={day ? t("quest.activityCell", { date: shortDate.format(toDate(day.date)), count: day.count }) : undefined}
                      style={{ aspectRatio: "1", borderRadius: 2, background: day ? LEVEL_COLORS[activityLevel(day.count, max)] : "transparent" }}
                    />
                  );
                }),
              ])}
              <span />
              {monthLabels.map((label, column) => (
                <span key={`month-${column}`} aria-hidden style={{ color: colors.textFaint, fontSize: font.size.micro, whiteSpace: "nowrap", overflow: "visible", width: 0 }}>
                  {label}
                </span>
              ))}
            </div>
            <div aria-hidden style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 8, color: colors.textFaint, fontSize: font.size.micro }}>
              <span style={{ marginRight: 2 }}>{t("quest.activityLess")}</span>
              {LEVEL_COLORS.map((color) => <span key={color} style={{ width: 9, height: 9, borderRadius: 2, background: color }} />)}
              <span style={{ marginLeft: 2 }}>{t("quest.activityMore")}</span>
            </div>
            {active.length > 0 && (
              <>
                <button
                  type="button"
                  aria-expanded={showDays}
                  onClick={() => setShowDays((open) => !open)}
                  style={{ marginTop: 10, padding: 0, background: "none", border: "none", color: colors.accentBright, fontSize: font.size.label, fontWeight: 700, cursor: "pointer" }}
                >
                  {t("quest.activityShowDays")}
                </button>
                {showDays && (
                  <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4, fontSize: font.size.small, color: colors.textDim }}>
                    {[...active].reverse().map((day) => (
                      <li key={day.date}>{t("quest.activityCell", { date: shortDate.format(toDate(day.date)), count: day.count })}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </div>
    </WorkspacePanel>
  );
}

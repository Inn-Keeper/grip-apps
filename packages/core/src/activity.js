// Quest activity heatmap: status_events counted per local day, as weeks of Monday-first days.

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * @param {{ createdAt: string }[]} events
 * @param {Date} now
 * @param {number} [weeks]
 * @returns {({ date: string, count: number } | null)[][]} weeks of 7 days; days after now are null
 */
export function activityByDay(events, now, weeks = 26) {
  const counts = new Map();
  for (const event of events) {
    const date = new Date(event.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = dayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = dayKey(now);
  const mondayOffset = (now.getDay() + 6) % 7;
  // Built from y/m/d so DST changes never shift a day.
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset - (weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = dayKey(new Date(first.getFullYear(), first.getMonth(), first.getDate() + week * 7 + weekday));
      return date > today ? null : { date, count: counts.get(date) ?? 0 };
    })
  );
}

/** 0 for no activity, otherwise 1 to 4 by quarter of the busiest day. */
export function activityLevel(count, max) {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil((count / max) * 4));
}

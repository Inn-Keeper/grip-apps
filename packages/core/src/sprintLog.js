// Skeleton sprint log: what the runs so far say about speed and blind spots.

const TOP_MISSED = 3;

/**
 * @param {{ seconds: number, ranOut: boolean, missed: string[] }[]} sprints
 * @returns {{ count: number, bestSeconds: number | null, finishedPct: number | null,
 *   topMissed: { label: string, count: number }[] }}
 */
export function sprintStats(sprints) {
  const finished = sprints.filter((sprint) => !sprint.ranOut);
  const misses = new Map();
  for (const sprint of sprints) {
    for (const label of sprint.missed ?? []) misses.set(label, (misses.get(label) ?? 0) + 1);
  }
  return {
    count: sprints.length,
    // Only a finished diagram counts as a time; a run that hit zero has none.
    bestSeconds: finished.length ? Math.min(...finished.map((sprint) => sprint.seconds)) : null,
    finishedPct: sprints.length ? Math.round((finished.length / sprints.length) * 100) : null,
    topMissed: [...misses].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, TOP_MISSED),
  };
}

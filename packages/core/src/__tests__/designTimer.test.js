import {
  DESIGN_PHASES,
  ROUND_MINUTES,
  ROUND_MS,
  SPRINT_PHASES,
  formatClock,
  phaseAt,
  roundProgress,
} from "../designTimer.js";
import { TALK_TRACK_SECTIONS } from "../talkTrack.js";

const MIN = 60_000;

describe("DESIGN_PHASES", () => {
  it("budgets exactly one round with unique ids", () => {
    const total = DESIGN_PHASES.reduce((sum, p) => sum + p.minutes, 0);
    expect(total).toBe(ROUND_MINUTES);
    expect(ROUND_MS).toBe(ROUND_MINUTES * MIN);
    expect(new Set(DESIGN_PHASES.map((p) => p.id)).size).toBe(DESIGN_PHASES.length);
  });

  it("spends the most time on the deep dive", () => {
    const longest = [...DESIGN_PHASES].sort((a, b) => b.minutes - a.minutes)[0];
    expect(longest.id).toBe("deepDive");
  });

  it("points every phase at talk-track sections that exist", () => {
    const known = new Set(TALK_TRACK_SECTIONS.map((s) => s.id));
    const covered = new Set();
    for (const phase of DESIGN_PHASES) {
      expect(phase.sectionIds.length).toBeGreaterThan(0);
      for (const id of phase.sectionIds) {
        expect(known.has(id)).toBe(true);
        covered.add(id);
      }
    }
    // Every beat you have to write down gets clock time allocated to it.
    expect(covered.size).toBe(TALK_TRACK_SECTIONS.length);
  });
});

describe("phaseAt", () => {
  it("starts in the first phase", () => {
    const state = phaseAt(0);
    expect(state.phase.id).toBe(DESIGN_PHASES[0].id);
    expect(state.index).toBe(0);
    expect(state.overrun).toBe(false);
  });

  it("advances exactly on the boundary, not a tick late", () => {
    const first = DESIGN_PHASES[0].minutes * MIN;
    expect(phaseAt(first - 1).index).toBe(0);
    expect(phaseAt(first).index).toBe(1);
  });

  it("reports time elapsed and left within the current phase", () => {
    const state = phaseAt(2 * MIN);
    expect(state.phaseElapsedMs).toBe(2 * MIN);
    expect(state.phaseRemainingMs).toBe((DESIGN_PHASES[0].minutes - 2) * MIN);
  });

  it("lands in the last phase during its final minute", () => {
    const state = phaseAt(ROUND_MS - MIN);
    expect(state.index).toBe(DESIGN_PHASES.length - 1);
    expect(state.overrun).toBe(false);
  });

  it("flags overrun past the round without leaving the last phase", () => {
    const state = phaseAt(ROUND_MS + 5 * MIN);
    expect(state.overrun).toBe(true);
    expect(state.index).toBe(DESIGN_PHASES.length - 1);
    expect(state.phaseRemainingMs).toBe(0);
  });

  it("treats negative and non-finite elapsed time as the start", () => {
    for (const input of [-1, NaN, undefined]) {
      expect(phaseAt(input).index).toBe(0);
    }
  });
});

describe("roundProgress", () => {
  it("reports remaining time and percentage through the round", () => {
    expect(roundProgress(0)).toEqual({ remainingMs: ROUND_MS, percent: 0, overrun: false });
    expect(roundProgress(ROUND_MS / 2).percent).toBe(50);
  });

  it("clamps remaining time at zero once the round is blown", () => {
    const progress = roundProgress(ROUND_MS + MIN);
    expect(progress.remainingMs).toBe(0);
    expect(progress.percent).toBe(100);
    expect(progress.overrun).toBe(true);
  });
});

describe("formatClock", () => {
  it("renders MM:SS zero-padded", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65_000)).toBe("01:05");
    expect(formatClock(40 * MIN)).toBe("40:00");
  });

  it("floors partial seconds rather than rounding up past the limit", () => {
    expect(formatClock(1_999)).toBe("00:01");
  });

  it("renders overtime with a leading minus", () => {
    expect(formatClock(-90_000)).toBe("-01:30");
  });
});

describe("skeleton sprint", () => {
  it("runs two minutes of scope, then eight of skeleton, on the same clock", () => {
    expect(phaseAt(1 * MIN, SPRINT_PHASES).phase.id).toBe("sprintScope");
    expect(phaseAt(2 * MIN, SPRINT_PHASES).phase.id).toBe("sprintSkeleton");
    expect(roundProgress(4 * MIN, SPRINT_PHASES).remainingMs).toBe(6 * MIN);
    expect(roundProgress(10 * MIN + 1, SPRINT_PHASES).overrun).toBe(true);
    // The full round is untouched.
    expect(roundProgress(10 * MIN + 1).overrun).toBe(false);
  });
});

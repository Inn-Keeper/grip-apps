import { PEAK_FACTOR, deriveScale } from "../estimation.js";

// 1M users × 10 requests/day, of which 10 are writes at 1 KB, kept a year.
const scale = {
  dau: 1_000_000,
  actionsPerUserPerDay: 10,
  writesPerUserPerDay: 10,
  payloadKb: 1,
  retentionDays: 365,
};

describe("deriveScale", () => {
  it("derives writes per day from users and per-user write activity", () => {
    expect(deriveScale(scale).writesPerDay).toBe(10_000_000);
  });

  it("drives QPS from total requests, not just the writes", () => {
    const readHeavy = deriveScale({ ...scale, actionsPerUserPerDay: 100 });
    expect(readHeavy.requestsPerDay).toBe(100_000_000);
    expect(Math.round(readHeavy.peakQps)).toBe(3472);
  });

  it("does not let read traffic inflate stored bytes", () => {
    // A read-heavy catalog serves 100x the traffic it stores.
    const readHeavy = deriveScale({ ...scale, actionsPerUserPerDay: 1000, writesPerUserPerDay: 0.01 });
    expect(Math.round(readHeavy.storageGb)).toBe(4);
  });

  it("spreads requests over a day for average QPS", () => {
    expect(Math.round(deriveScale(scale).avgQps)).toBe(116);
  });

  it("applies the peak multiplier on top of average QPS", () => {
    const { avgQps, peakQps } = deriveScale(scale);
    expect(peakQps).toBeCloseTo(avgQps * PEAK_FACTOR, 5);
  });

  it("sizes storage over the retention window, not forever", () => {
    // 10M writes/day × 1 KB × 365 days = 3.65e9 KB = 3650 GB.
    expect(Math.round(deriveScale(scale).storageGb)).toBe(3650);
    const shortLived = deriveScale({ ...scale, retentionDays: 30 });
    expect(Math.round(shortLived.storageGb)).toBe(300);
  });

  it("treats missing or nonsense inputs as zero rather than NaN", () => {
    const derived = deriveScale({
      dau: NaN,
      actionsPerUserPerDay: -5,
      writesPerUserPerDay: -5,
      payloadKb: undefined,
      retentionDays: 0,
    });
    expect(derived.writesPerDay).toBe(0);
    expect(derived.peakQps).toBe(0);
    expect(derived.storageGb).toBe(0);
  });
});

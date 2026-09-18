import { buildFunnelSummary } from "../funnel.js";

const now = new Date(2026, 0, 29);
const contact = (status, date, extra = {}) => ({
  name: status,
  status,
  date,
  nextAction: "",
  nextActionDate: "",
  ...extra,
});

describe("buildFunnelSummary", () => {
  it("uses exact transition events when available (no survivorship bias)", () => {
    const event = (contactId, status, day) => ({ contactId, status, createdAt: `2026-01-${day}T10:00:00` });
    // c-reject applied then was rejected: it must still count toward Applied.
    const summary = buildFunnelSummary(
      [
        contact("Contacted", "28-01-2026"),
        contact("Interviewing", "18-01-2026"),
        contact("Rejected", "25-01-2026"),
      ],
      [
        event("c-1", "Contacted", "10"),
        event("c-2", "Contacted", "11"),
        event("c-2", "Applied", "12"),
        event("c-2", "Interviewing", "18"),
        event("c-reject", "Contacted", "20"),
        event("c-reject", "Applied", "22"),
        event("c-reject", "Rejected", "25"),
      ],
      now
    );

    expect(summary.exact).toBe(true);
    expect(summary.reached).toEqual({ Contacted: 3, Applied: 2, Interviewing: 1, Offer: 0 });
    expect(summary.rates.contactedToApplied).toBeCloseTo(2 / 3);
    // Two Applied events within the 28-day window -> 0.5/week.
    expect(summary.recentApplied).toBe(2);
    expect(summary.applicationsPerWeek).toBe(0.5);
  });

  it("counts current statuses and reached-stage conversion rates", () => {
    const summary = buildFunnelSummary([
      contact("Contacted", "28-01-2026"),
      contact("Applied", "27-01-2026"),
      contact("Applied", "20-01-2026"),
      contact("Interviewing", "18-01-2026"),
      contact("Offer", "15-01-2026"),
      contact("Rejected", "10-01-2026"),
    ], [], now);

    expect(summary.total).toBe(6);
    expect(summary.active).toBe(5);
    expect(summary.counts).toMatchObject({ Contacted: 1, Applied: 2, Interviewing: 1, Offer: 1, Rejected: 1 });
    expect(summary.reached).toEqual({ Contacted: 5, Applied: 4, Interviewing: 2, Offer: 1 });
    expect(summary.rates.contactedToApplied).toBeCloseTo(0.8);
    expect(summary.rates.appliedToInterviewing).toBeCloseTo(0.5);
    expect(summary.rates.interviewingToOffer).toBeCloseTo(0.5);
  });

  it("calculates recent application pace from current stage dates", () => {
    const summary = buildFunnelSummary([
      contact("Applied", "28-01-2026"),
      contact("Interviewing", "20-01-2026"),
      contact("Offer", "03-01-2026"),
      contact("Applied", "20-12-2025"),
      contact("Contacted", "28-01-2026"),
    ], [], now);

    expect(summary.recentApplied).toBe(3);
    expect(summary.applicationsPerWeek).toBe(0.8);
  });

  it("surfaces follow-up and volume signals", () => {
    const summary = buildFunnelSummary([
      contact("Contacted", "28-01-2026", { nextAction: "ping", nextActionDate: "01-01-2026" }),
      contact("Applied", "27-01-2026"),
    ], [], now);

    expect(summary.due).toBe(1);
    expect(summary.signals.join(" ")).toMatch(/Top of funnel is thin/);
    expect(summary.signals.join(" ")).toMatch(/Application pace is low/);
    expect(summary.signals.join(" ")).toMatch(/follow-up/);
    expect(summary.signalIds.map((s) => s.id)).toEqual(expect.arrayContaining(["thin", "pace", "due"]));
  });
});

// Hiring funnel analytics.
// Preferred input is status_events (one row per stage transition, written by
// a DB trigger): conversions count every contact that *ever* reached a stage
// (no survivorship bias) and pace counts actual Applied events. When no
// events are available the summary falls back to a current-stage
// approximation derived from the contacts list alone.
import { STATUSES, isDue, parseDDMMYYYY } from "./contacts.js";

const ACTIVE_STATUSES = STATUSES.filter((status) => status !== "Rejected");
const STATUS_INDEX = Object.fromEntries(STATUSES.map((status, index) => [status, index]));
export const PACE_WINDOW_DAYS = 28;
// Below this many applications a week, pace is the likely bottleneck (the Quest headline goal).
export const PACE_GOAL_PER_WEEK = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const round1 = (value) => Math.round(value * 10) / 10;
const rate = (numerator, denominator) => (denominator > 0 ? numerator / denominator : 0);

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isRecent(date, now) {
  if (!date || Number.isNaN(date.getTime())) return false;
  const elapsed = startOfDay(now).getTime() - startOfDay(date).getTime();
  return elapsed >= 0 && elapsed <= PACE_WINDOW_DAYS * DAY_MS;
}

/**
 * @typedef {object} StatusEvent
 * @property {string} contactId
 * @property {string} status
 * @property {string} createdAt
 */

/** Exact reach + pace from transition events. */
function reachFromEvents(events, now) {
  const maxStageByContact = new Map();
  let recentApplied = 0;
  for (const event of events) {
    const stage = STATUS_INDEX[event.status];
    if (stage === undefined || event.status === "Rejected") continue;
    const current = maxStageByContact.get(event.contactId) ?? -1;
    if (stage > current) maxStageByContact.set(event.contactId, stage);
    if (event.status === "Applied" && isRecent(new Date(event.createdAt), now)) recentApplied += 1;
  }
  const stages = [...maxStageByContact.values()];
  const reachedAtLeast = (status) => stages.filter((stage) => stage >= STATUS_INDEX[status]).length;
  return {
    reached: {
      Contacted: stages.length,
      Applied: reachedAtLeast("Applied"),
      Interviewing: reachedAtLeast("Interviewing"),
      Offer: reachedAtLeast("Offer"),
    },
    recentApplied,
  };
}

/** Approximation when no events exist: current stage only, rejected excluded. */
function reachFromContacts(contacts, now) {
  const active = contacts.filter((contact) => contact.status !== "Rejected");
  const reachedAtLeast = (status) =>
    active.filter((contact) => (STATUS_INDEX[contact.status] ?? 0) >= STATUS_INDEX[status]).length;
  const reached = {
    Contacted: active.length,
    Applied: reachedAtLeast("Applied"),
    Interviewing: reachedAtLeast("Interviewing"),
    Offer: reachedAtLeast("Offer"),
  };
  const recentApplied = active.filter(
    (contact) =>
      (STATUS_INDEX[contact.status] ?? 0) >= STATUS_INDEX.Applied &&
      isRecent(parseDDMMYYYY(contact.date), now)
  ).length;
  return { reached, recentApplied };
}

/**
 * @param {Array<{ status?: string, date?: string, nextAction?: string, nextActionDate?: string }>} contacts
 * @param {StatusEvent[]} [events]
 * @param {Date} [now]
 */
export function buildFunnelSummary(contacts = [], events = [], now = new Date()) {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const contact of contacts) {
    if (contact.status in counts) counts[contact.status] += 1;
  }

  const active = contacts.filter((contact) => contact.status !== "Rejected");
  const exact = events.length > 0;
  const { reached, recentApplied } = exact ? reachFromEvents(events, now) : reachFromContacts(contacts, now);

  const rates = {
    contactedToApplied: rate(reached.Applied, reached.Contacted),
    appliedToInterviewing: rate(reached.Interviewing, reached.Applied),
    interviewingToOffer: rate(reached.Offer, reached.Interviewing),
  };

  const applicationsPerWeek = round1(recentApplied / (PACE_WINDOW_DAYS / 7));
  const due = contacts.filter(isDue).length;

  // Stable ids + params for translated UIs; `signals` keeps the English text for mobile.
  const signalIds = [];
  if (active.length < 8) signalIds.push({ id: "thin" });
  if (applicationsPerWeek < PACE_GOAL_PER_WEEK) signalIds.push({ id: "pace" });
  if (reached.Applied >= 5 && rates.appliedToInterviewing < 0.25) signalIds.push({ id: "targeting" });
  if (reached.Interviewing >= 3 && rates.interviewingToOffer < 0.2) signalIds.push({ id: "interviews" });
  if (due > 0) signalIds.push({ id: "due", params: { count: due } });
  if (signalIds.length === 0) signalIds.push({ id: "healthy" });
  const SIGNAL_TEXT = {
    thin: () => "Top of funnel is thin: add more contacts before judging conversion.",
    pace: () => "Application pace is low: volume is probably the first bottleneck.",
    targeting: () => "Applications are not turning into interviews yet: tune targeting, CV, and referrals.",
    interviews: () => "Interview conversion is the bottleneck: prioritize retros and focused drills.",
    due: () => `${due} follow-up${due === 1 ? "" : "s"} due: clear these before adding more leads.`,
    healthy: () => "Pipeline shape is healthy enough: keep shipping applications and learning from replies.",
  };
  const signals = signalIds.map(({ id }) => SIGNAL_TEXT[id]());

  return {
    total: contacts.length,
    active: active.length,
    exact,
    counts,
    reached,
    rates,
    recentApplied,
    applicationsPerWeek,
    due,
    signals,
    signalIds,
    statuses: ACTIVE_STATUSES,
  };
}

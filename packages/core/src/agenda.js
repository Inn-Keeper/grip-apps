// Quest agenda: what needs doing today, what slipped, which interviews to prep and the week ahead.
import { TERMINAL_STATUSES, parseDDMMYYYY } from "./contacts.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;
// parseDDMMYYYY accepts any three dash-separated numbers, so check the shape first.
const DATE_SHAPE = /^\d{2}-\d{2}-\d{4}$/;
const byName = (a, b) => a.name.localeCompare(b.name);

/** Whole local days from today to the contact's next action date, or null without a valid date. */
function daysUntil(contact, today) {
  if (!DATE_SHAPE.test(contact.nextActionDate ?? "")) return null;
  const due = parseDDMMYYYY(contact.nextActionDate);
  // Rounded so a DST change (23 or 25 hour day) still counts as one day.
  return due ? Math.round((due.getTime() - today.getTime()) / DAY_MS) : null;
}

/**
 * @template {{ name: string, status: string, nextActionDate: string, postingTechs?: string[], retros?: { toImprove: string }[] }} C
 * @param {C[]} contacts
 * @param {Date} now
 */
export function buildAgenda(contacts, now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dated = contacts
    .filter((c) => !TERMINAL_STATUSES.includes(c.status))
    .map((c) => ({ contact: c, days: daysUntil(c, today) }))
    .filter((item) => item.days !== null);

  const todayList = dated.filter((item) => item.days === 0).map((item) => item.contact).sort(byName);
  const overdue = dated
    .filter((item) => item.days < 0)
    .sort((a, b) => a.days - b.days)
    .map((item) => ({ ...item.contact, daysLate: -item.days }));
  const week = dated
    .filter((item) => item.days > 0 && item.days <= WEEK_DAYS)
    .sort((a, b) => a.days - b.days)
    .map((item) => item.contact);
  // Retros arrive sorted by created_at, so the last one is the newest.
  const prep = contacts
    .filter((c) => c.status === "Interviewing")
    .map((c) => ({ ...c, techs: c.postingTechs ?? [], lastToImprove: c.retros?.at(-1)?.toImprove || null }))
    .sort(byName);

  return {
    today: todayList,
    overdue,
    prep,
    week,
    isEmpty: todayList.length + overdue.length + prep.length + week.length === 0,
  };
}

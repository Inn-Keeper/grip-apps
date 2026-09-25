// Quest contacts, their retros and status history.
import { dateToDb, dateToUi, fail } from "./shared.js";

/** @param {any} supabase */
export function contactsApi(supabase) {
  const contactToUi = (r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    role: r.role ?? "",
    link: r.link ?? "",
    note: r.note ?? "",
    date: dateToUi(r.date),
    nextAction: r.next_action ?? "",
    nextActionDate: dateToUi(r.next_action_date),
    postingTechs: r.posting_techs ?? [],
    retros: (r.retros ?? [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((x) => ({
        id: x.id,
        round: x.round ?? "",
        questions: x.questions ?? "",
        wentWell: x.went_well ?? "",
        toImprove: x.to_improve ?? "",
        struggledTechs: x.struggled_techs ?? [],
        date: dateToUi(x.date),
      })),
  });

  const contactToDb = (c) => ({
    name: c.name,
    status: c.status,
    role: c.role || null,
    link: c.link || null,
    note: c.note || null,
    date: dateToDb(c.date),
    next_action: c.nextAction || null,
    next_action_date: dateToDb(c.nextActionDate),
    posting_techs: c.postingTechs ?? [],
  });

  async function listContacts() {
    const { data, error } = await supabase
      .from("contacts")
      .select("*, retros(*)")
      .order("created_at");
    if (error) fail(error);
    return data.map(contactToUi);
  }

  async function upsertContact(c) {
    const row = contactToDb(c);
    const q = c.id
      ? supabase.from("contacts").update(row).eq("id", c.id)
      : supabase.from("contacts").insert(row);
    const { error } = await q;
    if (error) fail(error);
  }

  async function deleteContact(id) {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) fail(error);
  }

  async function addRetro(contactId, retro) {
    const { error } = await supabase.from("retros").insert({
      contact_id: contactId,
      round: retro.round || null,
      questions: retro.questions || null,
      went_well: retro.wentWell || null,
      to_improve: retro.toImprove || null,
      struggled_techs: retro.struggledTechs ?? [],
    });
    if (error) fail(error);
  }

  async function deleteRetro(id) {
    const { error } = await supabase.from("retros").delete().eq("id", id);
    if (error) fail(error);
  }


  /** @returns {Promise<{ contactId: string, status: string, createdAt: string }[]>} */
  async function listStatusEvents() {
    const { data, error } = await supabase
      .from("status_events")
      .select("contact_id, status, created_at")
      .order("created_at");
    if (error) fail(error);
    return data.map((row) => ({ contactId: row.contact_id, status: row.status, createdAt: row.created_at }));
  }

  return { listContacts, upsertContact, deleteContact, addRetro, deleteRetro, listStatusEvents };
}

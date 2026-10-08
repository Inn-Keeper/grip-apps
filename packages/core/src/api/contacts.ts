// Quest contacts, their retros and status history.
import type { Contact, Retro, StatusEvent } from "../api";
import { dateToDb, dateToUi, fail, type Db, type Tables, type TablesInsert } from "./shared";

const CONTACT_COLUMNS = "id,name,status,role,link,note,date,next_action,next_action_date,posting_techs,retros(id,round,questions,went_well,to_improve,struggled_techs,date,created_at)";
type RetroRow = Pick<Tables<"retros">, "id" | "round" | "questions" | "went_well" | "to_improve" | "struggled_techs" | "date" | "created_at">;
type ContactRow = Pick<Tables<"contacts">, "id" | "name" | "status" | "role" | "link" | "note" | "date" | "next_action" | "next_action_date" | "posting_techs"> & { retros: RetroRow[] | null };
type ContactInput = Contact & { stageReachedOn?: string };

export function contactsApi(supabase: Db) {
  const contactToUi = (r: ContactRow): Contact => ({
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

  const contactToDb = (c: ContactInput) => ({
    name: c.name,
    status: c.status,
    role: c.role || null,
    link: c.link || null,
    note: c.note || null,
    date: dateToDb(c.date),
    next_action: c.nextAction || null,
    next_action_date: dateToDb(c.nextActionDate),
    posting_techs: c.postingTechs ?? [],
    // Only import sets it; the status trigger dates the first event by it.
    ...(c.stageReachedOn !== undefined && { stage_reached_on: dateToDb(c.stageReachedOn) }),
  }) satisfies TablesInsert<"contacts">;

  async function listContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .order("created_at");
    if (error) fail(error);
    return data.map(contactToUi);
  }

  async function upsertContact(c: Contact): Promise<void> {
    const row = contactToDb(c);
    const q = c.id
      ? supabase.from("contacts").update(row).eq("id", c.id)
      : supabase.from("contacts").insert(row);
    const { error } = await q;
    if (error) fail(error);
  }

  /** Saves imported contacts in one request, so they all land or none do. Client ids make a retry a no-op. */
  async function importContacts(contacts: (ContactInput & { id: string })[]): Promise<void> {
    const rows = contacts.map((c) => ({ id: c.id, ...contactToDb(c) }));
    const { error } = await supabase.from("contacts").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) fail(error);
  }

  async function deleteContact(id: string): Promise<void> {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) fail(error);
  }

  async function addRetro(
    contactId: string,
    retro: Omit<Retro, "id" | "date"> & { date?: string }
  ): Promise<void> {
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

  async function deleteRetro(id: string): Promise<void> {
    const { error } = await supabase.from("retros").delete().eq("id", id);
    if (error) fail(error);
  }

  async function listStatusEvents(): Promise<StatusEvent[]> {
    const { data, error } = await supabase
      .from("status_events")
      .select("contact_id, status, created_at")
      .order("created_at");
    if (error) fail(error);
    return data.map((row) => ({ contactId: row.contact_id, status: row.status, createdAt: row.created_at }));
  }

  return { listContacts, upsertContact, importContacts, deleteContact, addRetro, deleteRetro, listStatusEvents };
}

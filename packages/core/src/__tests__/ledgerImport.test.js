import { contactsApi } from "../api/contacts.js";
import { createLedgerImportApi, importRowToContact, importSummary, markDuplicates } from "../ledgerImport.js";

const parsed = {
  name: "Acme",
  role: "Frontend Dev",
  status: "Applied",
  date: "2026-09-30",
  stage_date: "2026-10-01",
  next_action: "Follow up",
  next_action_date: "2026-10-12",
  link: "https://jobs.acme.com/1",
  note: "Recruiter: jane@acme.com",
  source: "applied to acme",
  warnings: [],
};

describe("importRowToContact", () => {
  test("maps every field to the UI contact shape", () => {
    expect(importRowToContact(parsed, "id-1")).toEqual({
      id: "id-1",
      name: "Acme",
      role: "Frontend Dev",
      status: "Applied",
      date: "30-09-2026",
      stageReachedOn: "01-10-2026",
      nextAction: "Follow up",
      nextActionDate: "12-10-2026",
      link: "https://jobs.acme.com/1",
      note: "Recruiter: jane@acme.com",
      postingTechs: [],
    });
  });

  test("nulls become empty strings", () => {
    const row = { ...parsed, role: null, date: null, stage_date: null, next_action: null, next_action_date: null, link: null, note: null };
    expect(importRowToContact(row, "id-2")).toMatchObject({
      role: "", date: "", stageReachedOn: "", nextAction: "", nextActionDate: "", link: "", note: "",
    });
  });
});

describe("markDuplicates", () => {
  test("matches existing contacts and earlier rows, ignoring case and spaces", () => {
    const rows = [
      { id: "a", name: " acme " },
      { id: "b", name: "Globex" },
      { id: "c", name: "GLOBEX" },
      { id: "d", name: "Initech" },
    ];
    expect([...markDuplicates(rows, [{ name: "Acme" }])].sort()).toEqual(["a", "c"]);
  });
});

describe("importSummary", () => {
  test("counts what will be imported and skipped", () => {
    const rows = [
      { included: true, nextActionDate: "12-10-2026" },
      { included: true, nextActionDate: "" },
      { included: false, nextActionDate: "" },
    ];
    expect(importSummary(rows)).toEqual({ importing: 2, missingFollowUp: 1, skipped: 1 });
  });
});

describe("contactsApi.importContacts", () => {
  test("sends every row in one upsert keyed by the client ids", async () => {
    const calls = [];
    const supabase = {
      from: (table) => ({
        upsert: async (rows, options) => {
          calls.push({ table, rows, options });
          return { error: null };
        },
      }),
    };
    await contactsApi(supabase).importContacts([importRowToContact(parsed, "id-1"), importRowToContact({ ...parsed, name: "Globex" }, "id-2")]);
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("contacts");
    expect(calls[0].options).toEqual({ onConflict: "id", ignoreDuplicates: true });
    expect(calls[0].rows.map((r) => r.id)).toEqual(["id-1", "id-2"]);
    expect(calls[0].rows[0]).toMatchObject({ next_action_date: "2026-10-12", stage_reached_on: "2026-10-01", date: "2026-09-30" });
  });

  test("a failed upsert throws", async () => {
    const supabase = { from: () => ({ upsert: async () => ({ error: { message: "nope" } }) }) };
    await expect(contactsApi(supabase).importContacts([importRowToContact(parsed, "x")])).rejects.toThrow();
  });
});

describe("createLedgerImportApi", () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });

  test("posts the payload with the bearer token", async () => {
    let request;
    global.fetch = async (url, init) => {
      request = { url, init };
      return { ok: true, json: async () => ({ rows: [], unplaced: [] }) };
    };
    const api = createLedgerImportApi(async () => "tok", "http://ai/");
    await api.parseLedger({ text: "acme" });
    expect(request.url).toBe("http://ai/api/v1/ai/import/parse");
    expect(request.init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(request.init.body)).toEqual({ text: "acme" });
  });

  test("service errors carry code and status", async () => {
    global.fetch = async () => ({ ok: false, status: 413, json: async () => ({ error: { code: "ledger_too_long", message: "Too long." } }) });
    const api = createLedgerImportApi(async () => "tok", "http://ai");
    await expect(api.parseLedger({ text: "x" })).rejects.toMatchObject({ code: "ledger_too_long", status: 413, message: "Too long." });
  });
});

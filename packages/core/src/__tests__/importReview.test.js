import { hasInvalidImportRows, readImport, reviewImportRows } from "../importReview.js";

const parsed = {
  name: "Acme",
  role: "",
  status: "Applied",
  date: null,
  stage_date: null,
  next_action_date: null,
  link: "https://example.com/job",
  must_have_techs: [],
  source: "Acme",
  warnings: ["missing_role", "missing_next_action_date", "stage_date_unknown"],
};
const row = {
  id: "one",
  name: "Acme",
  role: "",
  link: "",
  included: true,
  nextActionDate: "",
  warnings: parsed.warnings,
};

test("corrections clear stale warnings and duplicate marks without changing selections", () => {
  const contacts = [{ name: "Acme", role: "Developer" }];
  expect(reviewImportRows([row], contacts)[0].warnings).toContain("duplicate");
  const corrected = {
    ...row,
    name: "Other",
    role: "Developer",
    nextActionDate: "12-10-2026",
    included: false,
    warnings: [...row.warnings, "duplicate"],
  };
  expect(reviewImportRows([corrected], contacts)[0]).toMatchObject({
    included: false,
    warnings: ["stage_date_unknown"],
  });
  expect(reviewImportRows([{ ...corrected, name: "Acme", role: "Designer" }], contacts)[0].warnings).toContain(
    "possibleDuplicate",
  );
});

test("blank names and impossible dates are flagged for correction", () => {
  const invalid = reviewImportRows([{ ...row, name: "  ", nextActionDate: "31-02-2026" }], []);
  expect(invalid[0].warnings).toEqual(expect.arrayContaining(["missing_name", "invalid_follow_up"]));
  expect(hasInvalidImportRows(invalid)).toBe(true);
  expect(hasInvalidImportRows(invalid.map((item) => ({ ...item, included: false })))).toBe(false);
});

test("review waits for posting techs and initially skips duplicates", async () => {
  let finish;
  const posting = {
    readPostings: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  };
  const controller = new AbortController();
  const stages = [];
  const pending = readImport({
    ledger: { parseLedger: async () => ({ rows: [parsed, parsed], unplaced: ["unclear note"] }) },
    posting,
    payload: { text: "list" },
    contacts: [],
    readLinks: true,
    signal: controller.signal,
    newId: (() => {
      let id = 0;
      return () => String(++id);
    })(),
    onReadingLinks: () => stages.push("links"),
  });
  let resolved = false;
  pending.then(() => {
    resolved = true;
  });
  await Promise.resolve();
  expect(stages).toEqual(["links"]);
  expect(resolved).toBe(false);
  finish([{ url: parsed.link, status: "ok", text: "TypeScript" }]);
  const result = await pending;
  expect(result.rows[0].postingTechs).toEqual(["TypeScript"]);
  expect(result.rows.map((item) => item.included)).toEqual([true, false]);
  expect(result.unplaced).toEqual(["unclear note"]);
});

test("cancelled reads cannot return late results even if the provider ignores abort", async () => {
  const controller = new AbortController();
  const ledger = {
    parseLedger: async () => {
      controller.abort();
      return { rows: [parsed], unplaced: [] };
    },
  };
  await expect(
    readImport({
      ledger,
      posting: null,
      payload: { text: "list" },
      contacts: [],
      readLinks: false,
      signal: controller.signal,
      newId: () => "one",
    }),
  ).rejects.toMatchObject({ name: "AbortError" });
});

test("posting failures keep parsed techs and opting out never opens a link", async () => {
  const ledger = { parseLedger: async () => ({ rows: [{ ...parsed, must_have_techs: ["React"] }], unplaced: [] }) };
  const posting = { readPostings: jest.fn().mockRejectedValue(new Error("unreachable")) };
  const options = {
    ledger,
    posting,
    payload: { text: "list" },
    contacts: [],
    readLinks: true,
    signal: new AbortController().signal,
    newId: () => "one",
  };
  const result = await readImport(options);
  expect(result.rows[0]).toMatchObject({ postingTechs: ["React"], linkStatus: "unreachable" });
  posting.readPostings.mockClear();
  await readImport({ ...options, readLinks: false });
  expect(posting.readPostings).not.toHaveBeenCalled();
});

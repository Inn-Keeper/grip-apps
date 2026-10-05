import { buildAgenda } from "../agenda.js";

// Wednesday 2026-10-07, mid-afternoon local time.
const now = new Date(2026, 9, 7, 15, 0);
const contact = (name, nextActionDate, extra = {}) => ({
  id: name,
  name,
  role: "",
  status: "Applied",
  nextAction: "Follow up",
  nextActionDate,
  postingTechs: [],
  retros: [],
  ...extra,
});
const names = (list) => list.map((c) => c.name);

describe("buildAgenda", () => {
  test("empty input gives empty sections", () => {
    const agenda = buildAgenda([], now);
    expect(agenda).toMatchObject({ today: [], overdue: [], prep: [], week: [], isEmpty: true });
  });

  test("dates land in today, overdue, week or nowhere", () => {
    const agenda = buildAgenda(
      [contact("Today", "07-10-2026"), contact("Late", "06-10-2026"), contact("Soon", "09-10-2026"), contact("Far", "30-10-2026")],
      now
    );
    expect(names(agenda.today)).toEqual(["Today"]);
    expect(names(agenda.overdue)).toEqual(["Late"]);
    expect(names(agenda.week)).toEqual(["Soon"]);
    expect(agenda.isEmpty).toBe(false);
  });

  test("terminal contacts never appear in date sections", () => {
    const agenda = buildAgenda(
      [contact("Won", "07-10-2026", { status: "Offer" }), contact("Lost", "01-10-2026", { status: "Rejected" })],
      now
    );
    expect(agenda.isEmpty).toBe(true);
  });

  test("overdue counts days late and lists the latest first", () => {
    const agenda = buildAgenda([contact("Two", "05-10-2026"), contact("Three", "04-10-2026")], now);
    expect(agenda.overdue.map((c) => [c.name, c.daysLate])).toEqual([["Three", 3], ["Two", 2]]);
  });

  test("week is soonest first and ends 7 days ahead", () => {
    const agenda = buildAgenda(
      [contact("Seven", "14-10-2026"), contact("One", "08-10-2026"), contact("Eight", "15-10-2026")],
      now
    );
    expect(names(agenda.week)).toEqual(["One", "Seven"]);
  });

  test("prep uses the last retro and keeps contacts with nothing to show", () => {
    const retros = [{ toImprove: "older" }, { toImprove: "Explain partitioning" }];
    const agenda = buildAgenda(
      [
        contact("Globex", "", { status: "Interviewing", postingTechs: ["Kafka"], retros }),
        contact("Bare", "", { status: "Interviewing", postingTechs: undefined, retros: undefined }),
      ],
      now
    );
    expect(agenda.prep.map((c) => [c.name, c.techs, c.lastToImprove])).toEqual([
      ["Bare", [], null],
      ["Globex", ["Kafka"], "Explain partitioning"],
    ]);
  });

  test("unparseable dates are ignored by date sections", () => {
    const agenda = buildAgenda([contact("Bad", "2026-10-07"), contact("Empty", "")], now);
    expect(agenda.isEmpty).toBe(true);
  });
});

import { SCENARIOS } from "../arch.js";
import { buildScenarioCatalog, CUSTOM_CATEGORY, filterGroups } from "../scenarioCatalog.js";

describe("buildScenarioCatalog", () => {
  it("lists the built-ins, then the user's scenarios under their own group", () => {
    const { allScenarios, groups } = buildScenarioCatalog([{ id: "c1", name: "My ledger" }]);
    expect(allScenarios).toHaveLength(SCENARIOS.length + 1);
    expect(allScenarios.at(-1)).toMatchObject({ id: "c1", category: CUSTOM_CATEGORY, custom: true });
    expect(groups.at(-1)).toEqual({ label: CUSTOM_CATEGORY, options: [{ value: "c1", label: "My ledger" }] });
  });

  it("drops the custom group when there are none", () => {
    expect(buildScenarioCatalog().groups.some((g) => g.label === CUSTOM_CATEGORY)).toBe(false);
  });
});

describe("filterGroups", () => {
  const groups = [
    { label: "Fintech", options: [{ label: "Payments ledger" }, { label: "Card fraud scoring" }] },
    { label: "Commerce", options: [{ label: "Flash sale checkout" }, { label: "Payments split" }] },
  ];

  it("keeps every group for an empty query", () => {
    expect(filterGroups(groups, "")).toBe(groups);
  });

  it("keeps only matching options, across groups", () => {
    expect(filterGroups(groups, "payments").map((g) => g.options.map((o) => o.label))).toEqual([["Payments ledger"], ["Payments split"]]);
  });

  it("keeps a whole group when its label matches, and drops empty ones", () => {
    expect(filterGroups(groups, "fintech")).toEqual([groups[0]]);
  });
});

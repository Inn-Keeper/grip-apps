import assert from "node:assert/strict";
import { test } from "node:test";
import { filterGroups } from "./comboboxFilter.js";

const groups = [
  { label: "Fintech", options: [{ label: "Payments ledger" }, { label: "Card fraud scoring" }] },
  { label: "Commerce", options: [{ label: "Flash sale checkout" }, { label: "Payments split" }] },
];

test("an empty query keeps every group", () => {
  assert.equal(filterGroups(groups, ""), groups);
});

test("matching an option label keeps only matches, across groups", () => {
  assert.deepEqual(filterGroups(groups, "payments").map((g) => g.options.map((o) => o.label)), [["Payments ledger"], ["Payments split"]]);
});

test("matching a group label keeps the whole group and drops empty ones", () => {
  assert.deepEqual(filterGroups(groups, "fintech"), [groups[0]]);
});

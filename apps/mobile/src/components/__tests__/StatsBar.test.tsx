import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { t } from "@grip/core/i18n";
import { StatsBar } from "../StatsBar";

const scores = { xp: 35, answers: { React: { correct: 3, wrong: 1 } } };

describe("StatsBar", () => {
  it("renders rank, xp and accuracy", async () => {
    const view = await render(<StatsBar scores={scores} />);

    expect(view.getByText(/Intern/)).toBeTruthy();
    expect(view.getByText("35 XP")).toBeTruthy();
    expect(view.getByText(t("prep.accuracySummary", { pct: 75, count: 4 }))).toBeTruthy();
  });
});

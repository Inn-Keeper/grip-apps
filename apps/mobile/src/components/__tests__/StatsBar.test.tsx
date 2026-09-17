import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { t } from "@grip-apps/core/i18n";
import { StatsBar } from "../StatsBar";

const scores = { xp: 35, answers: { React: { correct: 3, wrong: 1 } } };

describe("StatsBar", () => {
  it("renders rank, xp, accuracy, and drill CTA", async () => {
    const onDrill = jest.fn();
    const view = await render(<StatsBar scores={scores} onDrill={onDrill} drillActive={false} />);

    expect(view.getByText(/Intern/)).toBeTruthy();
    expect(view.getByText("35 XP")).toBeTruthy();
    expect(view.getByText(t("prep.accuracySummary", { pct: 75, count: 4 }))).toBeTruthy();

    fireEvent.press(view.getByText(/Drill weakest/));
    expect(onDrill).toHaveBeenCalledTimes(1);
  });

  it("keeps the drill CTA disabled while a drill is active", async () => {
    const onDrill = jest.fn();
    const view = await render(<StatsBar scores={scores} onDrill={onDrill} drillActive />);

    fireEvent.press(view.getByText(/Drill weakest/));
    expect(onDrill).not.toHaveBeenCalled();
  });
});

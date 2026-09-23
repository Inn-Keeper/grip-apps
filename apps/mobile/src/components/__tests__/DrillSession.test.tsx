import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { DrillSession, type Drill } from "../DrillSession";

const activeDrill: Drill = {
  questions: [
    {
      tech: "React",
      color: "#14B8A6",
      q: { question: "What does state represent?", options: ["A snapshot", "A database"], correct: 0 },
    },
  ],
  index: 0,
  answered: null,
  correctCount: 0,
  done: false,
  difficulty: "mid",
  shownAt: Date.now(),
  lastBonus: 0,
  bonusXp: 0,
};

describe("DrillSession", () => {
  it("shows the speed clock only on the timed tier", async () => {
    const timed = await render(<DrillSession drill={{ ...activeDrill, difficulty: "ultra" }} onAnswer={jest.fn()} onNext={jest.fn()} onExit={jest.fn()} />);
    expect(timed.getByText("0:20")).toBeTruthy();
    const untimed = await render(<DrillSession drill={activeDrill} onAnswer={jest.fn()} onNext={jest.fn()} onExit={jest.fn()} />);
    expect(untimed.queryByText(/^0:\d\d$/)).toBeNull();
  });

  it("lets the user answer the current question", async () => {
    const onAnswer = jest.fn();
    const view = await render(<DrillSession drill={activeDrill} onAnswer={onAnswer} onNext={jest.fn()} onExit={jest.fn()} />);

    fireEvent.press(view.getByText(/A snapshot/));
    expect(onAnswer).toHaveBeenCalledWith(0);
  });

  it("shows completion copy and exits back to cards", async () => {
    const onExit = jest.fn();
    const view = await render(
      <DrillSession
        drill={{ ...activeDrill, correctCount: 1, done: true }}
        onAnswer={jest.fn()}
        onNext={jest.fn()}
        onExit={onExit}
      />
    );

    expect(view.getByText("1 / 1")).toBeTruthy();
    expect(view.getByText(/perfect bonus/)).toBeTruthy();

    fireEvent.press(view.getByText("Back to cards"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

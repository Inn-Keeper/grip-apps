import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { t } from "@grip/core/i18n";
import { QuizView } from "../QuizView";

const question = { question: "What does state represent?", options: ["A database", "A snapshot"], correct: 1 };
const props = { tech: "React", color: "#14B8A6", question, questionNumber: 1, total: 3, xp: 15, onNext: jest.fn(), isLast: false };

describe("QuizView", () => {
  it("hints before answering and reports the pick with haptics", async () => {
    const onAnswer = jest.fn();
    const view = await render(<QuizView {...props} answered={null} onAnswer={onAnswer} />);

    expect(view.getByText(t("prep.pickAnswer"))).toBeTruthy();
    fireEvent.press(view.getByLabelText("A. A database"));
    expect(onAnswer).toHaveBeenCalledWith(0);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  it("names the right answer after a miss", async () => {
    const view = await render(<QuizView {...props} answered={0} onAnswer={jest.fn()} />);

    expect(view.getByText(t("prep.notQuite", { letter: "B" }))).toBeTruthy();
    expect(view.queryByText(t("prep.pickAnswer"))).toBeNull();
  });

  it("shows tier XP on a correct answer", async () => {
    const view = await render(<QuizView {...props} answered={1} onAnswer={jest.fn()} />);

    expect(view.getByText(t("prep.correct", { xp: 15 }))).toBeTruthy();
    expect(view.getByText("+15")).toBeTruthy();
  });
});

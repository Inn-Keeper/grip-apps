import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { api } from "@/lib/api";
import { useScores } from "@/lib/useScores";
import { renderWithClient } from "@/test/renderWithClient";
import PrepScreen from "../index";

jest.mock("@/lib/api", () => ({
  api: {
    getAccuracyTimeline: jest.fn(async () => [
      { date: "2026-06-10", accuracy: 0.5, total: 2 },
      { date: "2026-06-11", accuracy: 0.75, total: 4 },
    ]),
    getUser: jest.fn(async () => null),
    getReviewQueue: jest.fn(async () => []),
    listContacts: jest.fn(async () => []),
    getQuestions: jest.fn(async () => [
      { id: "q1", tech: "TypeScript", category: "Languages", difficulty: "easy", prompt: "Sample?", options: ["a", "b", "c", "d"], correct: 0, explanation: null },
    ]),
  },
}));

jest.mock("@/lib/useScores", () => ({
  useScores: jest.fn(() => ({ scores: { xp: 0, answers: {} }, record: jest.fn(), addXp: jest.fn() })),
}));

describe("PrepScreen", () => {
  it("renders the prep dashboard with a level selector and starts a drill at the active level", async () => {
    const view = await renderWithClient(<PrepScreen />);

    expect(view.getByText(/Hatchling/)).toBeTruthy();
    expect(view.getByText("Accuracy over time")).toBeTruthy();

    // Settings sit behind one summary row; opening it shows both pickers.
    fireEvent.press(view.getByText(/questions per card/));
    await waitFor(() => expect(view.getByText("DIFFICULTY")).toBeTruthy());
    expect(view.getByText("Thunderstorm")).toBeTruthy();
    expect(view.getByText("QUESTIONS")).toBeTruthy();
    expect(view.getByText("All")).toBeTruthy();

    await waitFor(() => expect(api.getAccuracyTimeline).toHaveBeenCalled());

    // The Next up card starts a drill at the selected level and fetches that level's questions.
    expect(view.getByText("NEXT UP")).toBeTruthy();
    fireEvent.press(view.getByText(/Drill weakest|Start warm-up/));
    await waitFor(() => expect(view.getByText("DRILL")).toBeTruthy());
    expect(api.getQuestions).toHaveBeenCalled();
    expect(useScores).toHaveBeenCalled();
    // The first render loads React Native and Expo synchronously: 6-28 s on a
    // slow external drive. The waitFor calls above yield to the event loop, so
    // an already-expired 5 s default fails the test; allow a minute instead.
  }, 60_000);
});

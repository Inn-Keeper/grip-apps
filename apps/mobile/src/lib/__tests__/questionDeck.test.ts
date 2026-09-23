import { beforeEach, describe, expect, it } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearSeenQuestions, drawUnseen } from "../questionDeck";

const pool = ["a", "b", "c", "d"].map((id) => ({ id }));

describe("drawUnseen", () => {
  beforeEach(() => AsyncStorage.clear());

  it("shows every question at a level before repeating one", async () => {
    const first = await drawUnseen("ultra", pool, 2);
    const second = await drawUnseen("ultra", pool, 2);
    expect(new Set([...first, ...second].map((q) => q.id)).size).toBe(4);
  });

  it("tracks each difficulty separately and forgets on clear", async () => {
    await drawUnseen("ultra", pool, 4);
    const other = await drawUnseen("easy", pool, 4);
    expect(other).toHaveLength(4);
    clearSeenQuestions();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await AsyncStorage.getItem("grip.seenQuestions")).toBeNull();
  });
});

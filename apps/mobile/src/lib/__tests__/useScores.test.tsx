import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { api } from "../api";
import { useScores } from "../useScores";

jest.mock("../api", () => ({
  api: { getScores: jest.fn(), recordAnswer: jest.fn(), addXp: jest.fn() },
}));

const mocked = api as unknown as Record<"getScores" | "recordAnswer" | "addXp", jest.Mock<(...args: any[]) => Promise<any>>>;

// A tiny server: record_answer dedupes by request id, like the real RPC.
let server: { xp: number; ids: Set<string> };

async function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { ...await renderHook(() => useScores(), { wrapper }), client };
}

beforeEach(() => {
  jest.clearAllMocks();
  server = { xp: 0, ids: new Set() };
  mocked.getScores.mockImplementation(async () => ({ xp: server.xp, answers: {} }));
  mocked.recordAnswer.mockImplementation(async (_tech, correct, _source, _difficulty, id: string) => {
    if (!server.ids.has(id) && correct) server.xp += 10;
    server.ids.add(id);
  });
});

describe("useScores save status", () => {
  it("shows a failed answer, retries it with the same id and awards it once", async () => {
    // Server committed, then the response was lost: the ambiguous failure.
    mocked.recordAnswer.mockImplementationOnce(async (_t, _c, _s, _d, id: string) => {
      server.ids.add(id);
      server.xp += 10;
      throw new Error("timeout");
    });
    const { result } = await setup();
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.record("Go", true));
    await waitFor(() => expect(result.current.saveStatus.failed).toBe(1));
    const firstId = mocked.recordAnswer.mock.calls[0][4];

    await act(async () => result.current.saveStatus.retry());
    await waitFor(() => expect(result.current.saveStatus.failed).toBe(0));
    expect(mocked.recordAnswer.mock.calls[1][4]).toBe(firstId);
    await waitFor(() => expect(result.current.scores.xp).toBe(10));
    expect(server.xp).toBe(10);
  });

  it("keeps the other answer when one of two overlapping writes fails", async () => {
    mocked.recordAnswer.mockImplementationOnce(async () => { throw new Error("offline"); });
    const { result } = await setup();
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => { result.current.record("Go", true); result.current.record("SQL", true); });
    await waitFor(() => expect(result.current.saveStatus.pending).toBe(0));
    expect(result.current.saveStatus.failed).toBe(1);
    await waitFor(() => expect(result.current.scores.xp).toBe(10));
  });

  it("reports a failed bonus without retrying it", async () => {
    mocked.addXp.mockImplementationOnce(async () => { throw new Error("offline"); });
    const { result } = await setup();
    await waitFor(() => expect(result.current.loaded).toBe(true));

    await act(async () => result.current.addXp(50));
    await waitFor(() => expect(result.current.saveStatus.bonusFailed).toBe(1));
    await act(async () => result.current.saveStatus.retry());
    expect(mocked.addXp).toHaveBeenCalledTimes(1);
  });

  it("marks a failed score load as unavailable", async () => {
    mocked.getScores.mockImplementation(async () => { throw new Error("offline"); });
    const { result } = await setup();
    await waitFor(() => expect(result.current.saveStatus.loadFailed).toBe(true));
    expect(result.current.loaded).toBe(false);
  });
});


it("ignores a late answer failure after the account cache was cleared", async () => {
  let rejectWrite!: (error: Error) => void;
  mocked.recordAnswer.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectWrite = reject; }));
  const { result, client, rerender } = await setup();
  await waitFor(() => expect(result.current.loaded).toBe(true));
  await act(async () => result.current.record("Go", true));
  await waitFor(() => expect(rejectWrite).toBeDefined());
  await act(async () => { client.clear(); await rerender({}); });
  await act(async () => rejectWrite(new Error("old account timed out")));
  await waitFor(() => expect(result.current.saveStatus.pending).toBe(0));
  expect(result.current.saveStatus.failed).toBe(0);
  await act(async () => result.current.saveStatus.retry());
  expect(mocked.recordAnswer).toHaveBeenCalledTimes(1);
});

it("refuses a stale retry action after the account cache was cleared", async () => {
  mocked.recordAnswer.mockImplementationOnce(async () => { throw new Error("offline"); });
  const { result, client, rerender } = await setup();
  await waitFor(() => expect(result.current.loaded).toBe(true));
  await act(async () => result.current.record("Go", true));
  await waitFor(() => expect(result.current.saveStatus.failed).toBe(1));
  const retryOldAccount = result.current.saveStatus.retry;
  await act(async () => { client.clear(); await rerender({}); });
  await act(async () => retryOldAccount());
  expect(mocked.recordAnswer).toHaveBeenCalledTimes(1);
});

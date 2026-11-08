import { createPoeChatApi, POE_LIMITS } from "../poeChat.js";

const ok = (reply) => async () => ({ ok: true, status: 200, headers: { get: () => null }, json: async () => ({ reply }) });

describe("createPoeChatApi", () => {
  afterEach(() => {
    delete global.fetch;
  });

  test("posts the last 20 turns with locale and returns the reply", async () => {
    global.fetch = jest.fn(ok("Try Stories."));
    const api = createPoeChatApi(async () => "t", "https://ai.example/");
    const turns = Array.from({ length: 25 }, (_, i) => ({ role: i % 2 ? "poe" : "user", text: `turn ${i}` }));
    await expect(api.ask(turns, { locale: "sv" })).resolves.toBe("Try Stories.");
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe("https://ai.example/api/v1/ai/poe/chat");
    expect(init.headers.Authorization).toBe("Bearer t");
    const sent = JSON.parse(init.body);
    expect(sent.locale).toBe("sv");
    expect(sent.messages).toHaveLength(20);
    expect(sent.messages.at(-1).text).toBe("turn 24");
  });

  test("maps an API error to PoeChatError with code and retryAfter", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 429,
      headers: { get: (h) => (h.toLowerCase() === "retry-after" ? "120" : null) },
      json: async () => ({ error: { code: "poe_daily_limit", message: "Back tomorrow, friend." } }),
    }));
    const api = createPoeChatApi(async () => "t", "https://ai.example");
    await expect(api.ask([{ role: "user", text: "hi" }])).rejects.toMatchObject({
      name: "PoeChatError",
      code: "poe_daily_limit",
      status: 429,
      retryAfter: 120,
      message: "Back tomorrow, friend.",
    });
  });

  test("throws authentication_required without a token", async () => {
    global.fetch = jest.fn();
    const api = createPoeChatApi(async () => null, "https://ai.example");
    await expect(api.ask([{ role: "user", text: "hi" }])).rejects.toMatchObject({ code: "authentication_required" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("limits match the API caps", () => {
    expect(POE_LIMITS).toEqual({ userChars: 500, maxTurns: 20 });
  });
});

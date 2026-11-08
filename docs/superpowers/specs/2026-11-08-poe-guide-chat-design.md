# Poe guide chat design (web v1)

Date: 2026-11-08. Status: agreed in conversation, not yet planned or built.
Repos: `grip-ai-api` (endpoint, prompt, app guide) and `grip-apps` (web bubble, core client).
Mockup: option A ("floating bubble") from the brainstorm session; layout only.

## Intent

"Talk with Poe if you are lost." Grip has grown several areas (Quest, Interview Prep, Arch Board, Story Bank, Profile) and a new user, at any level (student, job hunter, senior engineer, enthusiast), can lose the thread of what each one is for and what to do next. Poe, the existing raven mascot, becomes a chat guide that answers how to use Grip, in Poe's voice from `BRAND.md`.

Success: a lost user opens the bubble, asks in their own words, and gets a short, correct answer that points them at the right area of Grip.

## Goals

- A chat with Poe reachable from every signed-in web screen.
- Poe answers questions about Grip: what each area does, how to use it, where to go next.
- Uses the existing Gemini setup in `grip-ai-api`, with the same auth and abuse limits as the playbook endpoint.

## Non-goals (v1)

- Poe reading the user's own data (pipeline, stories, scores, interviews). See "Later".
- Study or career advice ("how do I prepare for system design?"). Poe only points to the Grip area that helps.
- Saving conversations. A chat lives in browser memory until reload or sign-out; nothing is stored server-side.
- Mobile. Web first; mobile follows through `docs/mobile-parity.md`.
- Clickable links or actions in replies (plain text only).
- Streaming replies.

## Anti-goals

- Poe exhausting the Gemini quota that grading and the first-run playbook depend on.
- One user (or a script) spending everyone's budget: unbounded messages, retry loops, runaway history.
- Personal data reaching Google because a user pasted it into the chat.
- Poe inventing features Grip does not have, or answering outside Grip as if it were authoritative.
- A patronizing or frivolous tone (`BRAND.md`: "Never: patronizing, frivolous, or tone-deaf to job search stress").

## How it works

### API (`grip-ai-api`)

`POST /api/v1/ai/poe/chat`, bearer token required. Built as a `PoeChatService` next to `PlaybookService`, following the same pattern (`app/playbook_service.py`).

Request:

```json
{ "messages": [ { "role": "user" | "poe", "text": "..." } ] }
```

- Last item must be `role: "user"`. Each `text` max 500 chars; at most 20 items accepted, and only the last 10 are sent to the model.
- The server is stateless: the client sends the visible history each time. A forged `poe` turn is harmless because the prompt holds no secrets and Poe has no user data.

Response: `{ "reply": "..." }` (max ~1200 chars).

Model call: reuse `provider.generate(model, system_prompt, context, output_type)` unchanged, with a one-field Pydantic model `PoeReply { reply: str }`. Strict JSON output with a single string keeps the existing Gemini and Ollama clients as they are; no new plain-text path.

Order of checks per request (same as the playbook):

1. No token → 401. Validate the Supabase session.
2. Live provider limit (`current_limit()`) → return it without calling Gemini.
3. All concurrency slots busy → 503 `busy` with `retry_after`, never queued.
4. Per-user rolling 24h cap (`AI_POE_DAILY_CAP`) → 429 with the time until the oldest message expires.
5. Redact the user turns with `ledger.redact` (emails, phones, links, salaries) before they leave the server. Placeholders are not restored in the reply.
6. Call the model; on failure, refund the cap slot and remember a 429 provider limit.

Logging: request id, outcome code and counts only. Never log message text.

### Prompt and app guide

- `app/poe_prompt.py`: Poe's persona (from `BRAND.md` personality and "Tone in Text"), rules, and the app guide.
- `app/poe_guide.md`: a hand-written guide to Grip's screens, written from the current web app: each area, what it is for, the main actions, and "where do I go if I want X". Loaded once at startup into the system prompt.
- Rules in the prompt: answer only about using Grip; for anything else, decline in character and suggest the closest Grip area; never claim a feature not in the guide (say "Grip doesn't do that yet"); never ask for personal details; replies short (a few sentences, plain text, no markdown links).
- Upkeep cost: the guide must be updated when a screen or feature changes. Add a line to the AGENTS/README checklist so this is not forgotten.

### Web (`grip-apps`)

- `@grip/core`: `createPoeChatApi(getToken, aiUrl)` next to `createPlaybookApi`, bound in `apps/web/src/lib/api.ts`. Null when `VITE_AI_URL` is unset, and then the bubble is not rendered (same rule as grading and import).
- A Poe bubble button, bottom-right, on every signed-in screen (About included); hidden on sign-in, the first-run wizard and public share pages.
- Clicking it opens a small panel above it (option A): header "Poe", a greeting ("Lost? Ask me how anything in Grip works."), message list, the notice "Don't share personal details.", input with a 500-char limit, and Send.
- Send is disabled while a reply is in flight; one request per Send, no automatic retries.
- Errors from the API (`busy`, daily cap, provider limit) show the API's message inline as a Poe line; the input stays filled so the user can retry by hand after the wait.
- The conversation is component state lifted to the app shell, so closing and reopening the panel keeps it until reload or sign-out. Signing out clears it.
- Accessibility: the button has an accessible name, the panel is a labelled dialog that does not trap the page (non-modal), Escape closes it and returns focus to the button, new Poe replies are announced via `aria-live="polite"`, and it works at phone width.
- Follow `SCREEN-GUIDELINES.md` and `DESIGN.md` tokens (teal accent, Poe gold for the header).

## Decisions (from the conversation)

- Poe knows Grip only; no user data in v1.
- App-usage questions only; study questions are redirected to the matching area.
- Same API (`grip-ai-api`) and free-tier Gemini, on its own model.
- Conversations disappear (nothing persisted).
- Floating bubble placement (mockup option A); one Poe on Prep, "Chat with Poe" on hover.
- Limits, security, no private data, no runaway requests are required in v1.

## Builder's calls (made by Claude, open to correction)

- Web only for v1.
- Chat state survives closing the panel, not a reload.
- Plain text replies, no links.
- 500-char messages, last 10 turns to the model, reply cap ~1200 chars.
- Reuse the strict-JSON provider call with a single `reply` field instead of adding a text mode.
- Reuse `ledger.redact` on user turns.
- Stateless server; history sent by the client.
- Own concurrency slots (`AI_POE_MAX_CONCURRENT`, default 2), separate from the playbook's semaphore, so a busy chat never fails a first-run playbook.
- Gemini only. The local Ollama model (`Modelfile`) bakes in a grading system prompt, so on `AI_PROVIDER=ollama` the endpoint returns 503 `poe_unavailable` and the web hides the bubble when it gets that code.

## Quota and model (decided)

The whole API runs on the free Gemini tier: about 20 requests per day per model per project (observed; check Google AI Studio for current numbers), resetting at midnight Pacific. Grading and the playbook share `AI_MODEL_GRADE`.

- Poe gets its own model setting, `AI_MODEL_POE`, default `gemini-3.1-flash-lite` (already in `STRICT_GEMINI_MODELS`). Quota is per model, so Poe has its own daily bucket and cannot starve grading or the playbook.
- Provider limit memory (`current_limit()` / `remember()` in `GradeService`) becomes per model, so a Poe 429 only pauses Poe, and a grading 429 only pauses grading and the playbook. This touches grading code; keep the change small and covered by the existing tests.
- Per-user cap `AI_POE_DAILY_CAP`, default 5 messages per rolling day (claude's call: 10 would let two users spend the whole bucket). No separate global cap: Gemini's own 429, remembered per model, already acts as one.
- When Poe's bucket is spent, Poe says so in character with the reset time from the API, and the rest of Grip keeps working.
- Expect a demo-sized budget (about 20 Poe messages a day across all users). A paid key is the upgrade path if real usage arrives; only the cap defaults change.

## One Poe per corner (decided)

`PoeAssistant` already sits bottom-left on Interview Prep (under the left rail), reacting to answers and rank-ups. On Prep the chat panel opens anchored left, above it.

- On Prep there is one Poe. Clicking the mascot opens the chat and does nothing else: the random "Ask Poe for a thought" line is removed.
- Hovering (or keyboard focus) shows a "Chat with Poe" label. The button's accessible name says the same, since touch has no hover.
- Answer reactions (correct, wrong, level up) still play while the chat is closed. While it is open they are suppressed (no quote, no pose change) so nothing floats over the panel.
- Every other signed-in screen shows the plain Poe bubble bottom-right, with the same hover label. On Prep with the mascot hidden, the plain bubble shows instead.
- The Profile "show Poe" toggle keeps hiding only the reacting mascot; the chat bubble stays reachable everywhere.

## Later

- Poe reads the user's data and gives tailored next steps ("interview Thursday, no stories tagged for it yet").
- Study and career advice beyond app usage.
- Saved conversation history.
- Clickable links in replies that take the user to the screen.
- Mobile parity.
- Move caps and slots to Supabase if the API runs on more than one instance (same ponytail note as the playbook).

## Locale

The web app ships en, pt and sv. UI copy goes through `t()` in all three. The request carries the app locale and Poe replies in that language.

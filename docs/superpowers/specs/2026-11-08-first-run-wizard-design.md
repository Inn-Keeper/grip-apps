# First-run wizard design (web v1)

Date: 2026-11-08. Status: agreed in conversation, not yet planned or built.
Supersedes the v1 scope of `docs/superpowers/plans/2026-11-07-personalized-first-run.md`; that plan stays as background for later phases.
Mockup: `docs/first-open-mockup.html` (visual direction only; see "Mockup corrections").

## Intent

Hiring has become a gauntlet of playbook questions, system design rounds and screening noise. Grip exists to cut through that and get people the job they want. The first run should turn "what I know, what I want, which role" into a ready practice kit in a couple of minutes: the likely interview questions for that role, a sample answer for each, and a system design exercise tied to them.

Success: a new user finishes setup and lands in real practice built around their target role, with stories and a board already waiting.

## Goals

- Collect stack, goal, target role and (optionally) experience in one short wizard.
- Use AI from v1 to generate a **playbook**: the behavioral and technical questions this user is likely to face, each saved as a story with a sample STAR answer.
- Generate one **custom Arch Board scenario** for the role and link the technical stories to it (story → scenario → board, the existing connection).
- Land the user on the screen that matches their goal.

## Non-goals (v1)

- Mobile. Web first; mobile follows through `docs/mobile-parity.md`.
- A "preparation focus" model, focus switching across screens, `preparation_focuses` / `preparation_artifacts` tables.
- Resuming a half-finished wizard on another device, regeneration diffs, Quest application linking.
- Storing the CV file or its text.

## Anti-goals

- Presenting invented experience as the user's own. Samples are allowed and wanted (they lead the user), but anything not grounded in the user's own notes or CV must be visibly marked as a sample to rewrite.
- Sending personal data to the AI provider that the user has not seen and approved.
- Blocking the user from practicing because AI failed or is slow.

## Flow

`Stack → Goal → Role → Experience (optional) → Review → Generate → Land`

1. **Stack.** Multi-select chips from `PREP_TECHS` (54 techs, 11 categories): show popular ones plus a search box. Selection is saved to `favorite_techs` (Prep already reads it). Zero selected is allowed (fundamentals).
2. **Goal.** One of: technical interviews, explaining past work, system design, explore. For system design, an optional free-text brief ("design a reliable payments service").
3. **Role (optional).** A plain "Target role" text field saved to the existing `profiles.target_role`, plus one field that accepts a job link or a pasted description. Links go through the existing posting reader in grip-ai-api; on failure, ask the user to paste the text and keep everything entered. Detected techs (`extractTechsFromText`) not in the stack are offered as "Add Java?" chips.
4. **Experience (optional).**
   - Upload a CV (.pdf/.txt) using the existing browser reader `apps/web/src/profile/cvParser.ts`.
   - Redact in the browser before anything leaves it: emails, phone numbers, URLs, street-address-like lines, and the user's display name from their profile.
   - Show the redacted text in an editable box labeled with what the AI will see. The user can delete anything else. This preview is the real safeguard; regex redaction will miss things.
   - Two or three short "past experience" notes in free text. Rough notes are fine.
5. **Review.** Summary of the four steps with an edit link per row, and one primary action named for the goal. Starting generation is the consent point; the review names the real provider that will receive the text, for example "Google Gemini" or "a local model" (my call: `/api/v1/ai/status` gains a `provider` field).
6. **Generate and land.** The user waits on a progress screen inside the wizard, which owns the request and the saves (production runs on Gemini, so the wait is short). The screen has a "Start practicing instead" link that leaves without generating; Stories then offers "Generate my playbook" to try later.
   - **Waiting animation (decided):** Poe walks across the screen from one side to the other, in a 90s video game pixel-art style, looping until the result arrives. A short status line under him says what is happening ("Reading the role", "Writing your playbook"), announced to screen readers.
   - Implementation: a small pixel-art sprite sheet (walk cycle, a few frames) animated with CSS `steps()` and `image-rendering: pixelated`. No animation library.
   - Reduced motion: show one still frame and the status line only.
   - Art: no pixel sprite of Poe exists yet (current mascot PNGs are photoreal, `docs/poe-mascot-spec.md`). The sprite is a new asset to produce and add to the mascot spec; until it exists, the builder uses a placeholder frame.
   - Rule change first: SCREEN-GUIDELINES rules 32 and 34 forbid decorative motion and limit what may animate. Add an exception to rule 34 for the playbook generation wait ("the motion is the message: work is in progress"), the same reasoning as the Thunderstorm clock.

Every step except Stack and Goal can be skipped. Skipping everything still yields a playbook based on goal and stack alone, with every answer marked as a sample.

## Generation

One new authenticated endpoint in grip-ai-api, reusing the existing provider selection, auth, busy/quota handling and typed generation:

`POST /api/v1/ai/first-run/playbook`

Input: stack, goal, optional design brief, optional role title, optional job text (already fetched or pasted), optional redacted CV text, optional experience notes, locale, plus the allowed `COMPETENCIES` and `NODE_TYPES` ids.

Output:

- `stories[]`: `title` (the interview question), `competency`, `situation`, `task`, `action`, `result`, `technical` (true when it should link to the scenario).
- `scenario`: `name`, `brief`, `checks[]` in the existing `Check` shape (`packages/core/src/arch.js`).

Rules:

- Treat job text, CV and notes as data, never instructions.
- Never invent employers, dates, metrics or ownership. When the user's material has no matching fact, write a generic sample.
- Validate server side and reject on violation: `competency` in `COMPETENCIES`; every `type`/`from`/`to` in checks is a `NODE_TYPES` id; bounded `points`; bounded counts and lengths.
- Inputs are not logged. The CV text is used for this request and discarded (my call: no stored CV; re-upload to regenerate later).

## Ingestion flow

What happens to the user's input from the wizard to saved stories. Everything left of the network boundary runs in the browser.

```mermaid
flowchart TD
  subgraph Browser
    A[Stack, goal, brief, role] --> R
    J[Job link] -->|posting reader, existing| JT[Job text]
    P[Pasted job text] --> JT
    JT --> R
    CV[CV file .pdf/.txt] -->|cvParser, existing| CT[CV text]
    CT --> X[Redact: emails, phones, URLs, addresses, display name]
    X --> E[Editable preview: what the AI will see]
    N[Experience notes] --> E
    E --> R[Review: provider named, user starts generation]
  end
  R -->|POST /api/v1/ai/first-run/playbook| G1
  subgraph grip-ai-api
    G1[Auth: Supabase bearer token] --> G2{Provider limited?<br/>shared breaker}
    G2 -->|yes| F1[429 + Retry-After]
    G2 -->|no| G3{Same input cached?}
    G3 -->|yes| OUT
    G3 -->|no| G4{User daily cap left?}
    G4 -->|no| F2[429 + Retry-After]
    G4 -->|yes| G5{Concurrency slot free?}
    G5 -->|no| F3[503 busy + Retry-After]
    G5 -->|yes| G6[Gemini: strict JSON schema]
    G6 -->|429| F4[Remember limit, 429]
    G6 --> G7{Validate: competencies, node types, points, sizes}
    G7 -->|invalid| F5[502, nothing saved]
    G7 -->|valid| OUT[Cache and return playbook]
  end
  OUT --> S1
  subgraph Save[Browser, existing Supabase APIs]
    S1[upsertCustomScenario] --> S2[upsertStory per question<br/>is_sample = true, playbook label,<br/>scenarioId on technical ones]
    S2 --> S3[onboarding_completed = true]
    S3 --> L[Land on the goal's screen]
  end
  F1 & F2 & F3 & F4 & F5 --> FB[Show reason and retry time;<br/>user can start practicing instead]
```

Data kept: stack, role, generated scenario and stories. Data discarded after the request: job text, CV text, notes. Nothing from those inputs is logged.

## Traffic control (Gemini)

Reuse what grip-ai-api already has and add three small guards:

- **Already there:** 429 parsing into daily quota vs per-minute limit with `Retry-After` (`app/gemini.py`); a shared breaker that answers from memory while the provider is limited (`current_limit` / `remember` in `app/service.py`, already shared by import); no retry once a request reached Gemini; an input-hash cache for grades.
- **Add:** an input-hash cache for playbook results (same pattern as `grade_cache_key`), so an unchanged wizard resubmit costs nothing.
- **Add:** a per-user daily cap on playbook generations (same pattern as `posting_service._spend`; default 3/day, configurable).
- **Add:** a concurrency cap on model calls (an `asyncio.Semaphore`); when full, answer 503 busy with `Retry-After` instead of queueing.
- **Client:** one call per wizard, button disabled while in flight, honor `Retry-After`, never auto-retry.
- Ceiling: all of this is in-process memory, so it resets on restart and is per instance. Move counters to a Supabase table if the API runs on more than one instance.

## Saving and landing

The client saves the result through existing APIs, no model writes to the database:

1. `upsertCustomScenario` for the scenario.
2. `upsertStory` for each story, with `scenarioId` set to the new scenario for `technical` stories.
3. Set `onboarding_completed = true`.

Landing by goal: technical interviews → Prep drill on the selected stack; explaining past work → Stories; system design → Arch Board on the generated scenario; explore → Prep.

Reruns (decided): generating again never removes or replaces anything. Older stories, earlier generated ones and manual ones are all kept; the new playbook and scenario are added next to them. The wizard opens prefilled with the current stack and role, and finishing it saves them over `favorite_techs` and `target_role` (my call: the user saw and confirmed them on Review).

Playbook label (decided): add `stories.playbook text null`, set on generated stories to a short name for the run (the target role, or the goal when no role was given, for example "Backend Engineer"). Stories shows it as a label so generated stories stay distinguishable from manual ones permanently, even after editing. Label styling follows DESIGN.md (no teal, which is reserved for the accent); exact color is the builder's call. Manual stories have `null`.

Sample marking (my call): add `stories.is_sample boolean not null default false`. Every generated story is saved with `true`, even ones drafted from the user's notes, because the server cannot verify what the model drew from. The Stories screen shows a small "Sample" tag; the first user edit that saves the story sets it back to `false`.

Gating (my call):

- Auto-open the wizard only for accounts with `onboarding_completed = false`.
- Stop `profileFormToUpdate` (`packages/core/src/user.js`) from setting `onboarding_completed` on every profile save.
- Existing accounts see the wizard too (decided): a one-time migration resets `onboarding_completed = false` for every profile, because today any Profile save has set it to `true`. A missing profile row counts as `false`. Mobile signups see the wizard on their first web visit.
- Profile gets a "Set up your practice" entry that reopens the wizard.
- A visible "Explore first" link closes the wizard and also sets `onboarding_completed`, so it does not reappear.
- Public boards, share links and auth callbacks are never blocked by the wizard.

## Failure behavior

- AI unavailable, busy, over quota, or invalid output: setup still completes (stack, role saved), the user lands on their goal's screen, and a local message offers "Try generating again". Nothing partial is saved from an invalid response.
- Partial save failure (scenario saved, a story failed): show which items saved and retry only the missing ones. (Builder's call how; avoid duplicate scenarios on retry.)
- Oversized input: cap job text, CV text and notes on the client with a visible counter rather than silently truncating. Exact limits are the builder's call against `ai_context_max_chars` and the output budget.

## Constraints

- Follow `BRAND.md`, `DESIGN.md` and `SCREEN-GUIDELINES.md`; tokens, not hardcoded colors.
- Copy in English, Portuguese and Swedish. No em or en dashes in copy.
- Keyboard and screen reader: radio-group semantics for the goal, labeled edit buttons, step changes announced, reduced motion respected.
- New web code lives in a scoped folder (for example `apps/web/src/firstRun/`).
- CHANGELOG entry; one migration for `stories.is_sample`, `stories.playbook` and the `onboarding_completed` reset.
- Checks: `pnpm run ci` in grip-apps; pytest and ruff in grip-ai-api. Live model tests only when asked.

## Mockup corrections

- System design lands on Arch Board, not "Open Prep".
- Replace the role dropdown with a text field.
- Add the Experience step.
- "Do this later" should not silently jump to review; use "Skip" per optional step and "Explore first" to leave.
- Poe may appear once on the welcome or review screen.

## Left to the builder

- Prompt wording, number of stories within a 5 to 8 range, and the model output budget for this operation (story text is long; check `ai_max_output_tokens`, especially on Ollama).
- Redaction regexes.
- Component structure, query hooks and how the wizard is mounted in `App.tsx`.
- Whether the arch board row is created at generation time or when the user first opens the scenario.

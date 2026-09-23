# Mobile parity assessment

Assessed on 2026-09-23 by reading the code and CHANGELOG, not by running the app. Mobile is on hold until the web
app is right; this is the starting list for when it comes back. Almost everything since 2026-09-18 shipped on web
only; 2026-09-17 and earlier shipped on both.

## Data safety (web and mobile share one database)

| Area | State |
| --- | --- |
| Story to scenario link | Safe. Mobile edits the whole story object, so `scenarioId` round-trips. |
| Board to story link | Safe. Mobile never sends `storyId`; `boardToDb` only writes `story_id` when sent. |
| One board per story | Safe. Mobile can't set a board's story, so it can't hit the unique index. |
| Talk track grade | Aligned. Mobile clears the grade on talk track edits, like web. |
| Boards on custom scenarios | Fixed 2026-09-23 (phase 1): mobile loads your custom scenarios, so these boards open. |

## Missing on mobile, by screen

**Arch Board** (biggest gap)
- Creating and deleting custom scenarios. (Picking and loading them, and a searchable picker, shipped in phase 1.)
- The board's story picker and the story's STAR.
- The five-step workflow rail, Next Up coaching, and the graded verdict (thinnest section, the interviewer's question).
- AI grading: "Grade my reasoning", quoted evidence per section, rate-limit handling (`@grip/core/talkGrade`).
- Scale brief handing numbers to the talk track, and "Check my math".
- Undo and redo, share links, full screen (mobile has its own Zen mode).

**Stories**
- The competency coverage headline and Next Up for the first uncovered competency.
- The scenario link: picker, "New scenario from this story", "New board for this story", the story's board with its scores.

**Prep** (about 40 web strings have no mobile counterpart)
- Mock loop (`@grip/core/mockLoop`).
- Thunderstorm's 20s clock and ×1.5 XP speed bonus.
- Unseen questions first (web `questionDeck.ts`); mobile draws from the raw pool.
- Readiness score, category mastery percentages, Signal.
- Auto-next, the practice settings card, tech search.
- Poe assistant, rail lock during a session.
- Mobile does have the review queue and the accuracy timeline.

**Quest**
- Has: funnel, retros, story match, prep plan.
- Missing: stage filters, Next Up, the applications-per-week headline, the stage velocity panel (`@grip/core/pipeline`), focused views for contact detail and forms.

**Profile**
- Has: language, CV import, rank and XP.
- Missing: headline, target role, location, portfolio, LinkedIn, time zone; GitHub linking and "use GitHub techs for prep" (`@grip/core/githubUrl`); autosave, the completion headline, Reset under Preferences.

**App level**
- No Fly Me tour (mobile has an older `about.tsx`, not a tab), no shared board page, no abbreviation or ⓘ explainers (`@grip/core/abbreviations`).

## Present on both, but behaving differently

- **XP:** a Thunderstorm answer earns different XP on each app, so rank can drift.
- **Repeats:** web tracks seen questions per level; mobile doesn't, so the same account sees repeats there.
- **Screen standard:** no mobile screen has had the SCREEN-GUIDELINES.md pass (Next Up, one main action, focused views, locked rails).
- **E2E:** the Maestro smoke flow needs `EMAIL`/`PASSWORD` and dismisses nothing; Expo Go's first-launch developer menu blocks it on a fresh simulator. `board-zen-evaluate.yaml` needs the dev-client build.

## Suggested order

1. ~~Custom scenarios on the board: loading and picking them, and a searchable picker.~~ Done 2026-09-23.
2. Scoring parity: the speed bonus and unseen-first drawing.
3. Story links: scenario and board on the story, story on the board (the data model is done).
4. AI grading and the workflow rail on the board.
5. Profile fields and GitHub prep, then the Prep extras (Mock loop, readiness, Auto-next).
6. A SCREEN-GUIDELINES.md pass per screen, with the Maestro flows updated.

# Mobile parity assessment

Assessed on 2026-09-23 and updated 2026-10-21 by reading the code and CHANGELOG, not by running the app. Mobile is on hold until the web
app is right; this is the starting list for when it comes back. Almost everything since 2026-09-18 shipped on web
only; 2026-09-17 and earlier shipped on both.

## Data safety (web and mobile share one database)

| Area | State |
| --- | --- |
| Story to scenario link | Safe. Mobile edits the whole story object, so `scenarioId` round-trips. |
| Board to story link | Safe. Mobile has a story picker and saves `storyId`, like web. |
| One board per story | Safe. Both pickers only offer stories no other board holds, so neither hits the unique index. |
| Talk track grade | Aligned. Mobile clears the grade on talk track edits, like web. |
| Boards on custom scenarios | Fixed 2026-09-23 (phase 1): mobile loads your custom scenarios, so these boards open. |
| Web canvas items (shapes, free arrows, styles) | Safe. Mobile copies whole nodes on move and edit, so `shape`, `w`, `h` (on shapes and resized components), `x2`, `y2` and `style` survive a mobile save. Free arrows stay in the data even though mobile does not draw them. |
| Free board brief | Safe. Mobile never sends `brief`, and `boardToDb` only writes it when sent. |

## Missing on mobile, by screen

**Arch Board** (biggest gap)
- Creating and deleting custom scenarios. (Picking and loading them, and a searchable picker, shipped in phase 1.)
- Next Up coaching beyond the rail. (The five-step rail, AI grading and the graded verdict shipped in phase 4.)
- Undo and redo, share links, full screen (mobile has its own Zen mode).
- The web canvas tools (added 2026-10-21). Free boards, drag to connect and the removal of cost and the scale panel are already on both.

  Phase 1 (display, 2026-10-21) is done: mobile draws web boards as web does. Phase 2 (editing, 2026-10-21) is done too: tool row with Components sheet, shapes, arrow, line and text tools, style bar with trash bin, corner resizing, four connect circles and the free board brief. Phase 3 (undo and redo, share links) is done too. Full screen is skipped: Zen covers it on a phone.

  | Feature | Web | Mobile |
  | --- | --- | --- |
  | Built-in components | Components dropdown | Palette strip |
  | Free text | Text tool: click to place, type in place | Palette chip, typed in a sheet; drawn with its style |
  | Shapes | Rectangle, diamond, ellipse, sticky note; resize and fill | Drawn with outline, fill and saved size; only Box can be added |
  | Text, shape and component style (size, color, fill, align, bold) | Style panel and shortcuts | Drawn; not editable |
  | Free arrows and lines | Draw, reshape, style | Drawn with color, dashes and heads; not editable |
  | Resizing (shapes and components) | Corner handles and Alt + arrow keys | Saved sizes drawn; no resizing |
  | Connect circles | Four per node (top, right, bottom, left) | One on the right; arrows route top to bottom when nodes are stacked |
  | Free board brief | Editable | Read only (graded against, not editable) |

**Stories**
- The competency coverage headline and Next Up for the first uncovered competency.
- "New scenario from this story" (creating scenarios stays on web). The rest of the story links shipped in phase 3.

**Prep** (about 40 web strings have no mobile counterpart)
- Signal. (Readiness, category mastery, Auto-next and tech search shipped in phase 5b, the Mock loop in 5c.)
- Poe assistant, rail lock during a session.
- Mobile does have the review queue and the accuracy timeline.

**Quest**
- Has: funnel, retros, story match, prep plan.
- Missing: stage filters, Next Up, the applications-per-week headline, the stage velocity panel (`@grip/core/pipeline`), focused views for contact detail and forms.

**Profile**
- Has: every profile field, GitHub linking and "use GitHub techs for prep", CV import, favorite techs (and Prep's From My Favorites category), language, rank and XP. Autosave, the completion headline, Next Up and Reset under Preferences shipped in phase 5a.
- Missing: the Poe assistant toggle (mobile has no Poe).

**App level**
- No Fly Me tour (mobile has an older `about.tsx`, not a tab), no shared board page, no abbreviation or ⓘ explainers (`@grip/core/abbreviations`).

## Present on both, but behaving differently

- **Screen standard:** no mobile screen has had the SCREEN-GUIDELINES.md pass (Next Up, one main action, focused views, locked rails).
- **E2E:** the Maestro smoke flow needs `EMAIL`/`PASSWORD` and dismisses nothing; Expo Go's first-launch developer menu blocks it on a fresh simulator. `board-zen-evaluate.yaml` needs the dev-client build.

## Suggested order

1. ~~Custom scenarios on the board: loading and picking them, and a searchable picker.~~ Done 2026-09-23.
2. ~~Scoring parity: the speed bonus and unseen-first drawing.~~ Done 2026-09-23.
3. ~~Story links: scenario and board on the story, story on the board.~~ Done 2026-09-23.
4. ~~AI grading and the workflow rail on the board.~~ Done 2026-09-23.
5. Profile: ~~autosave, completion and Next Up (5a)~~ Done 2026-09-23. Then the Prep extras: ~~readiness, Auto-next and tech search (5b)~~ Done 2026-09-23, and ~~the Mock loop (5c)~~ Done 2026-09-23.
6. A SCREEN-GUIDELINES.md pass per screen, with the Maestro flows updated.

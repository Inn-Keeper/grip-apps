<!-- Rule numbers run across sections so a rule can be cited by number. -->
<!-- markdownlint-disable MD029 -->

# UI/UX Guidelines - Grip

These are the rules every Grip web screen must follow. Each one is a constraint you can check. If a design breaks one, change the design or change the rule here first. The Prep screen follows all of them, so use it as the example. Colours and sizes are in [DESIGN.md](DESIGN.md), and names and tone of voice in [BRAND.md](BRAND.md).

## Layout

1. A screen has **one main action**, and it sits at the top of the main area.
2. Other ways to do the same thing appear as small links under the main action, **never** as extra buttons elsewhere.
3. Actions that belong to one item in a list stay hidden until that item is selected, hovered or focused with the keyboard. On touch screens they are always visible.
4. The left side panel is **only** for moving around and filtering.
5. The right side panel goes in this order: progress first, then insights, then settings. Settings start folded, and the folded row shows their current values.
6. The same information **never** appears in two places.
7. Content that sits on top of the screen, like the mascot, **never** hides other content.

## Doing a task

8. A task, such as a quiz or drill, opens in the main area. It **never** opens inside a card, and cards **never** change size.
9. **Only one** task can run at a time. Clicking to start another one does nothing until the first ends.
10. While a task runs, the side panels are locked and a short message says why. The section title hides, and decorative animation stops.
11. Changing a setting **never** throws away a task in progress.

## Feedback

12. **Every click gets a visible response** within a moment.
13. Loading and error messages appear **on or next to the thing that was clicked**, never somewhere else on the page.
14. Changing a setting shows a short confirmation. If the change affects what's on screen, that content visibly refreshes.
15. Rewards appear where the person is looking, for example "+10 XP" on the answer they just chose.
16. Big celebrations are **only** for perfect runs and new ranks.

## Numbers

17. A screen shows **one** headline number, and its label says exactly what it covers ("Ready for Acme").
18. Anything not yet tried counts as 0%, so a number can only go up through practice.
19. A percentage means **how good** someone is, not how much they have clicked. How much they have tried is shown separately, in words ("2 of 6 tried").
20. Every number can be explained where it appears, in a hint line or tooltip.

## Look

21. Borders are dark and quiet everywhere.
22. Coloured or bright borders are **only** for boxes that warn or point somewhere: the "Next up" suggestion, overdue items, errors, the current step and selected items.
23. Cards sit slightly raised off the page with a soft shadow. Cards with buttons lift **2px** more on hover or keyboard focus.
24. A recessed, darker look is **only** for areas inside a card, like a progress track, or for canvases. Boxes placed directly on the page are cards.
25. Progress bars use the dark-to-bright teal gradient. Big headline numbers are teal.
26. Text uses **only** the sizes and weights defined in DESIGN.md. Nothing people need to read is smaller than **11px**.

## Motion

27. Motion explains a change. **Never** add it only for decoration.
28. Each effect plays **once** when the screen opens. Numbers count up, bars grow and then blink, and charts draw in, all in about **1 second**.
29. Only one thing may animate on its own: a shine every **10 seconds** on the single active main button.
30. When the person has turned animations off in their system settings, **every** effect is skipped.

## Words and icons

31. Ranks describe the raven growing up: Hatchling → Fledgling → Night Flyer → Sky Raven → Elder Raven → Nevermore.
32. Difficulty levels describe the weather: Clear Skies → Tailwind → Headwind → Thunderstorm. The two sets of words are **never** mixed.
33. Text is short and says what happens ("Drill weakest", not "Get started").
34. Every piece of text exists in English, Portuguese and Swedish.
35. Icons are thin line drawings, look the same on web and mobile, and are **never** shown as a fallback shape.

## Accessibility

36. Everything that works with a mouse also works with a keyboard, including hover effects.
37. Locked areas cannot be reached by keyboard or screen reader.
38. Screen readers announce confirmations, errors and loading states.
39. Text keeps readable contrast on the dark background.

## Before calling a screen done

- [ ] It meets every rule above, or the rule it breaks was changed here first.
- [ ] It has been checked in the browser at a normal (1280px) and a wide (1680px) window.
- [ ] It has been checked with the system's reduced-motion setting turned on.

# CLAUDE.md

Frontend-only Kanban board (To Do, Doing, Done) in React 19, TypeScript and Vite. Items are
created through a form and must have a Rick and Morty character, fetched from a public GraphQL
API. There is no backend. See `README.md` for setup and the structure.

## Commands

```bash
npm run dev            # Vite dev server
npm test               # Vitest, run once; must stay green
npm run e2e            # Playwright drag-and-drop tests (Chromium); must stay green
npm run lint           # oxlint; must report nothing
npm run format:check   # Prettier; `npm run format` to fix
npm run build          # tsc -b, then vite build
```

## Decisions

The README lists the design decisions. Five have a longer record in `docs/adr/`: state shape
(0001), live moves during a drag (0002), collision detection (0003), keyboard movement (0004)
and undo history (0005). Read the relevant one before changing state shape, drag and drop or
undo, and say so if a change contradicts it.

## Accessibility

- Every control has an accessible name. Icon-only buttons get an `aria-label` that includes
  the card title ("Delete Build portal gun").
- Never put a button inside another button. The card's draggable body and its delete button
  are siblings for that reason.
- Interactive targets are at least 24 by 24 CSS pixels.
- Borders of inputs and bordered buttons use `border-control`. `border-line` is for decoration
  only: its contrast is too low for a control.
- Don't convey state by colour or shade alone, and keep animations behind `motion-safe:`.
- No sideways scrolling at 320px wide.
- When the UI changes without moving focus, announce it (see the drag announcements in
  `Board`).
- Add an axe state to `e2e/a11y.spec.ts` for every new screen state (dialog, menu, error).

## Conventions

- **Board changes go through `boardReducer`.** Keep it pure, and add a reducer test for every
  new action. `historyReducer` wraps it: a new action is undoable without further work, and
  anything dispatched between `dragStart` and `dragEnd` is one undo step.
- **One folder per component**: `Name.tsx`, `Name.test.tsx`, `index.ts`. Named exports only,
  except `App`.
- **`CardView` stays free of dnd-kit.** Drag wiring belongs in `SortableCard` and `Board`.
- **Colours come from the tokens in `src/index.css`**: white, black and greys. Don't add hues,
  `dark:` variants or hard-coded hex values in components.
- **Write Tailwind class names in full.** Never build them from strings (`bg-${x}`); the
  compiler cannot see them. Reuse the class lists in `src/lib/ui.ts` for inputs and buttons.
- **Tests query by role and label**, not by class name or test id. Mock `src/api/rickAndMorty`
  in component tests; never call the real API from a test.
- **Don't add dependencies without asking.**
- **Keep it small.** This is an interview exercise that will be extended live. Don't build
  persistence, filtering or other features ahead of being asked.
- Formatting is Prettier's job (no semicolons, single quotes, 100 columns). A hook formats
  files after each edit; don't hand-format.
- Drag and drop cannot be tested in jsdom; it is covered by Playwright in `e2e/`. After
  changing `Board`, `Column` or `SortableCard`, run `npm run e2e`. Drive drags with stepped
  `page.mouse` moves, as the helpers in `e2e/drag.spec.ts` do.
- Before finishing a change, run `npm test`, `npm run lint` and `npm run build`.

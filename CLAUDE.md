# CLAUDE.md

Frontend-only Kanban board (To Do, Doing, Done) in React 19, TypeScript and Vite. Items are
created through a form and must have a Rick and Morty character, fetched from a public GraphQL
API. There is no backend.

## Commands

```bash
npm run dev            # Vite dev server
npm test               # Vitest, run once; must stay green
npm run lint           # oxlint; must report nothing
npm run format:check   # Prettier; `npm run format` to fix
npm run build          # tsc -b, then vite build
```

## Decisions

Four decisions have a record in `docs/adr/`: state shape (0001), live moves during a drag
(0002), collision detection (0003) and keyboard movement (0004). Read the relevant one before
changing state shape or drag and drop, and say so if a change contradicts it.

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

## Conventions

- **Board changes go through `boardReducer`.** Keep it pure, and add a reducer test for every
  new action.
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
- Before finishing a change, run `npm test`, `npm run lint` and `npm run build`.

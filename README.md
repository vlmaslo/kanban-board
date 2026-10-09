# Rick and Morty Kanban

A frontend-only Kanban board with three columns (To Do, Doing, Done), built with React 19,
TypeScript and Vite. Every item is assigned a Rick and Morty character, loaded from the
[Rick and Morty GraphQL API](https://rickandmortyapi.com/graphql).

## Run it

Needs Node.js 22 and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

The character list is fetched from the public API in the browser, so it needs a network
connection. There is no backend and there are no environment variables.

```bash
npm test                          # unit and component tests (Vitest)
npx playwright install chromium   # once
npm run e2e                       # drag-and-drop and accessibility checks (Playwright)
npm run lint && npm run build
```

## Structure

```
src/
  App.tsx                       owns the board and its undo history (useReducer)
  types.ts                      Character, Item, BoardState, COLUMNS
  state/boardReducer.ts         add / remove / move
  state/historyReducer.ts       wraps boardReducer: last 10 boards, undo, a drag as one step
  api/rickAndMorty.ts           the GraphQL query, via fetch
  hooks/useCharacters.ts        loading / error / retry, abort on unmount
  lib/                          confetti, keyboard movement, shared class lists
  components/
    Board/                      DndContext, drag handlers, collision detection
    Column/                     droppable column + SortableContext
    SortableCard/               useSortable wrapper
    CardView/                   presentational card
    NewItemForm/                title, description, character list; validation
```

```
App ─┬─ NewItemForm ── useCharacters ── fetchCharacters
     └─ Board ── Column ── SortableCard ── CardView
          └──── DragOverlay ── CardView
```

## Design decisions

- **State is normalized and lives in one reducer.** `items` is a map by id; `columns` holds
  ordered id arrays. Moving a card never touches the item, and the reducer is a pure function
  with its own tests. ([0001](docs/adr/0001-normalized-board-state-in-reducer.md))
- **Cards move between columns live during the drag**, so the target column opens a gap. A
  snapshot taken at drag start restores the board if the drag is cancelled. The cost: the
  reducer sees half-finished drags, which the undo history has to step around.
  ([0002](docs/adr/0002-live-drag-preview-with-snapshot-restore.md))
- **Collision detection follows the pointer.** dnd-kit's stock `closestCorners` lets a tall
  empty column lose to the cards beside it.
  ([0003](docs/adr/0003-pointer-first-collision-detection.md))
- **Arrow keys move a card one column at a time.** dnd-kit's stock keyboard movement only
  worked for the top card in a column here.
  ([0004](docs/adr/0004-keyboard-moves-between-columns.md))
- **Undo keeps the last ten boards in memory, and a drag is one step.** A history reducer
  wraps the board reducer; mid-drag moves are not recorded, so one Undo takes back a whole
  drag. ([0005](docs/adr/0005-undo-history-as-board-snapshots.md))
- **dnd-kit for drag and drop:** headless, with mouse, touch and keyboard sensors.
- **`CardView` is presentational; `SortableCard` adds the drag wiring**, so the same card
  renders in a column and in the drag overlay.
- **Plain `fetch` for the one GraphQL query**, in a small hook with loading, error and retry
  states. No GraphQL client.
- **The character field is a list of native radio buttons** styled as rows with a picture and
  a name. Arrow keys, focus and form semantics come from the browser, with no custom ARIA
  code; the cost is that only the first page of characters is offered.
- **Confetti fires only when a card enters Done from another column**, not when it is
  reordered there, and is skipped under reduced motion.
- **Tailwind v4 with a few tokens** in `src/index.css`, in a monochrome palette.

## Tests

- **Vitest and Testing Library:** the reducers directly; components through roles and labels,
  with the API module mocked.
- **Playwright in Chromium:** drag and drop needs real layout, which jsdom does not have. The
  specs cover moving, reordering, the Done celebration, cancelling, keyboard moves and undo. The
  character API is stubbed, so they run offline.
- **Accessibility:** cards can be moved with the keyboard (focus a card, Space, arrow keys,
  Space; Escape cancels), controls are labelled, and axe-core runs against four states of the
  app. It has not been tried with a screen reader or on a touch device.

## Known limitations

- **Nothing is saved.** The board and its undo history reset on reload.
- **Undo has no redo**, and goes back ten changes at most.
- **Only the first 20 characters can be chosen.** The API paginates and only the first page
  is requested.
- **Items cannot be edited** after they are created, only moved or deleted.
- **Cards cannot be moved with a single click or tap**, only by dragging or with the keyboard.
- **Deleting a card leaves keyboard focus on the page body.**

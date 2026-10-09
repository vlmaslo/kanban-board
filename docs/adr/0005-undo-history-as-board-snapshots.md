# 0005. Undo history as board snapshots, with a drag as one step

- **Status:** Accepted
- **Date:** 2026-10-09
- **Amends:** [0001](0001-normalized-board-state-in-reducer.md) (the `restore` action) and
  [0002](0002-live-drag-preview-with-snapshot-restore.md) (where the drag snapshot lives)

## Context

The board needs undo for the last ten changes: creating, deleting, moving to another column
and reordering. The history is kept in memory.

[0001](0001-normalized-board-state-in-reducer.md) makes the board one immutable value, so a
history can simply be a list of earlier boards. The difficulty is
[0002](0002-live-drag-preview-with-snapshot-restore.md): a drag dispatches a `move` for every
column the card crosses, and one more on drop. Recording each action would make the user press
Undo several times to take back one drag, stepping through boards they never chose. 0002 named
undo as a reason to reconsider.

## Options considered

- **A: record every reducer action:** one drag becomes several steps.
- **B: keep the in-flight order in `Board` state and dispatch once on drop** (option B of
  0002): every action is then a step, but it rewrites the drag handlers and collision
  detection, which read the board mid-drag.
- **C: a history reducer around `boardReducer`, with the drag as a transaction.**
- **D: record inverse actions instead of boards:** less memory, but every new action needs a
  hand-written inverse. Ten boards that share their unchanged parts cost almost nothing.

## Decision

C. `src/state/historyReducer.ts` holds `{ past, present, dragStart }` and passes `add`,
`remove` and `move` to `boardReducer`. An action that changes the board pushes the board
before it onto `past`, which keeps the last ten.

`Board` dispatches `dragStart` at pick-up, and `dragEnd` or `dragCancel` at the end. While
`dragStart` is set, moves change `present` and record nothing. `dragEnd` records the pick-up
board once, if the order of cards changed; `dragCancel` puts it back. `undo` pops `past` into
`present` and is ignored during a drag.

The pick-up board moves from a ref in `Board` into the reducer, so `boardReducer` loses its
`restore` action. `Board` keeps only the column the card started in, for the celebration.

## Consequences

- One Undo takes back one drag, however many columns it crossed. A drag that ends where it
  began, or is cancelled, is not a step.
- `boardReducer` is unchanged apart from `restore`, and every board change still goes
  through it.
- `App` announces what was undone. `describeChange` works it out by comparing the two boards,
  so the history stores boards and nothing else.
- The reducer still sees intermediate boards during a drag. Code that reacts to board changes
  should wait until `dragStart` is null.
- A card's contents live in the snapshot, so undoing a delete brings back the same card.
- **Reconsider if:** redo is added (it needs a `future` list, cleared on a new change), or
  the history has to survive a reload.

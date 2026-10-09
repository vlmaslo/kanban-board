# 0002. Move cards live during a drag and restore a snapshot on cancel

- **Status:** Accepted, amended by [0005](0005-undo-history-as-board-snapshots.md) (the
  snapshot lives in the history reducer; `dragCancel` replaces `restore`)
- **Date:** 2026-10-01

## Context

When a card is dragged over another column, that column should open a gap where the card
would land. dnd-kit's sortable only animates items inside one list, so the card has to
actually be in the target list while the drag is still in progress.

## Options considered

- **A: dispatch `move` to the reducer on every drag-over**, keep a snapshot of the board
  from drag start, and dispatch `restore` if the drag is cancelled.
- **B: keep the in-flight order in separate component state** and commit once on drop.

## Decision

A. `Board` stores the pre-drag board in a ref. `onDragOver` dispatches cross-column moves,
`onDragEnd` applies the final within-column reorder, and `onDragCancel` (or a drop outside
any column) restores the snapshot.

## Consequences

- The snapshot also answers "which column did this card start in", which the celebration
  needs: confetti fires only when a card enters Done from another column.
- The reducer sees intermediate states. Anything that reacts to board changes, such as
  saving to storage, would run mid-drag.
- **Reconsider if:** persistence or undo is added. Option B removes the intermediate states.

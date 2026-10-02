# 0004. Left and Right move a card to the neighbouring column

- **Status:** Accepted
- **Date:** 2026-10-01
- **Amends:** [0003](0003-pointer-first-collision-detection.md) (collision detection for
  keyboard drags)

## Context

Keyboard dragging used dnd-kit's `sortableKeyboardCoordinates`. On an arrow key it looks for
the closest drop target whose left edge is further left or right than the dragged card's, and
moves the card onto it. That rule does not fit this layout, where cards sit 8px inside their
column and the column itself is a drop target:

- **Right, from a card that is not first in its column:** the card jumped onto the card
  above it instead of into the next column, so the drop reordered it.
- **Left:** the nearest target with a smaller left edge is the card's own column, so the first
  press did nothing visible and a second was needed.

Only the first card in a column moved sideways correctly.

Separately, [0003](0003-pointer-first-collision-detection.md) kept `closestCorners` for
keyboard drags, so a card moved by keyboard into a tall empty column hit the same problem
that record describes for the pointer.

## Options considered

- **A: keep `sortableKeyboardCoordinates`:** correct only for the top card.
- **B: remove the column padding** so cards and columns share a left edge: fragile, and Right
  would still be able to pick a card in the same column.
- **C: a coordinate getter that knows the board is columns.**

## Decision

C. `src/lib/keyboardCoordinates.ts`: Left and Right move the card to the top of the previous
or next column in `COLUMNS`; Up and Down defer to `sortableKeyboardCoordinates`. The card's
current column is read from its sortable data, which dnd-kit keeps current during a drag, so
the getter needs no board state.

The collision strategy drops its keyboard branch. With no pointer, `pointerWithin` finds
nothing and the existing `rectIntersection` fallback picks whatever the card overlaps.

## Consequences

- Left and Right always change column, one column per press, and do nothing at the board's
  edges.
- A card moved sideways lands at the top of the target column; Up and Down place it from there.
- Keyboard moves into tall empty columns work.
- The getter assumes columns are laid out left to right in `COLUMNS` order.

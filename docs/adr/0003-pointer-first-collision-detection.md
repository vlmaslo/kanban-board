# 0003. Pointer-first collision detection

- **Status:** Accepted, amended by [0004](0004-keyboard-moves-between-columns.md)
- **Date:** 2026-10-01

## Context

The board used dnd-kit's `closestCorners`. It scores each drop target by the average distance
between the four corners of the dragged card and the matching corners of the target; the
lowest score wins. That favours card-sized targets, which is why it is the usual choice for
boards: cards win over the column that contains them.

The same property works against an empty column. Its top corners can line up with the card,
but its bottom corners are a column-height away and count for half the score. Held at the top
of an empty column of height H, a 76px card scores (H - 76) / 2 against the column, and 308
against a card in the next column (292px column + 16px gap). The column wins only while H is
under about 690px.

Columns here have a minimum height of 60% of the window and stretch to the tallest column,
so with twelve cards in To Do, or on a tall window, an empty column is too tall to win. The
card snaps back even when it is released squarely over the column.

## Options considered

- **A: keep `closestCorners`:** fine for a handful of cards on a laptop; fails as above.
- **B: let columns shrink to their content:** hides the problem, but an empty column becomes
  a small target.
- **C: `pointerWithin`** alone: follows the cursor, but returns nothing for keyboard drags,
  and a drop in the gap between two cards resolves to the column, not a position.
- **D: a small custom strategy** built from dnd-kit's own helpers.

## Decision

D, in `Board.tsx`:

1. Keyboard drag (no pointer coordinates): `closestCorners`.
2. Otherwise `pointerWithin`, falling back to `rectIntersection`.
3. If the hit is a column that has cards, return the card nearest by `closestCenter`.

## Consequences

- A column takes the card as soon as the cursor enters it, whatever its height.
- A drop on a column's padding lands next to the nearest card instead of at the end.
- The strategy closes over the current board, so it is recreated on each render.
- `e2e/drag.spec.ts` has a spec for the tall-column case. It fails with `closestCorners`.
- **Reconsider if:** columns become scrollable or nested drop targets are added.

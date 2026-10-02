# 0001. Normalized board state in a pure reducer

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

A card has content (title, description, character) and a position (column and order).
Dragging changes position many times a second; content never changes during a drag.

## Options considered

- **A: items map + ordered id arrays per column**, updated by a reducer.
- **B: one array of items, each with `status` and `order` fields:** simpler to read, but
  every move rewrites items and reordering means renumbering.
- **C: a state library (Redux Toolkit, Zustand):** more than one component tree needs.

## Decision

A. `BoardState` is `{ items: Record<id, Item>, columns: Record<ColumnId, id[]> }`
(`src/types.ts`). `boardReducer` handles `add`, `remove`, `move` and `restore`.
`App` owns the state with `useReducer` and passes `board` and `dispatch` down.

## Consequences

- Moving or reordering never touches an item object.
- The reducer is pure, so it can be unit-tested without rendering anything.
- The whole board is one serialisable value, which makes persistence a small addition.
- `findColumn` scans the column arrays to locate a card. That is fine for tens of cards.
- **Reconsider if:** state is needed far from `App`, or several boards are loaded at once.

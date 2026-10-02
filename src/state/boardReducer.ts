import { arrayMove } from '@dnd-kit/sortable'
import type { BoardState, ColumnId, Item } from '../types'

export type BoardAction =
  | { type: 'add'; item: Item }
  | { type: 'remove'; id: string }
  // `index` is where the card ends up, in the same column or another one.
  | { type: 'move'; id: string; to: ColumnId; index: number }
  | { type: 'restore'; state: BoardState }

export const initialBoard: BoardState = {
  items: {},
  columns: { todo: [], doing: [], done: [] },
}

export function findColumn(state: BoardState, id: string): ColumnId | undefined {
  if (id in state.columns) return id as ColumnId
  return (Object.keys(state.columns) as ColumnId[]).find((col) => state.columns[col].includes(id))
}

// `from` is the column the drag started in. Cross-column moves are applied during the drag, so
// by drop time the card is already in Done whether it arrived there or was reordered there.
export function enteredDone(from: ColumnId | undefined, to: ColumnId | undefined): boolean {
  return to === 'done' && from !== 'done'
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'add':
      return {
        items: { ...state.items, [action.item.id]: action.item },
        columns: { ...state.columns, todo: [action.item.id, ...state.columns.todo] },
      }

    case 'remove': {
      const column = findColumn(state, action.id)
      if (!column) return state
      const { [action.id]: _removed, ...items } = state.items
      return {
        items,
        columns: {
          ...state.columns,
          [column]: state.columns[column].filter((id) => id !== action.id),
        },
      }
    }

    case 'move': {
      const from = findColumn(state, action.id)
      if (!from) return state
      if (from === action.to) {
        const ids = state.columns[from]
        const fromIndex = ids.indexOf(action.id)
        const toIndex = Math.max(0, Math.min(action.index, ids.length - 1))
        if (fromIndex === toIndex) return state
        return {
          ...state,
          columns: { ...state.columns, [from]: arrayMove(ids, fromIndex, toIndex) },
        }
      }
      const target = [...state.columns[action.to]]
      target.splice(Math.max(0, Math.min(action.index, target.length)), 0, action.id)
      return {
        ...state,
        columns: {
          ...state.columns,
          [from]: state.columns[from].filter((id) => id !== action.id),
          [action.to]: target,
        },
      }
    }

    case 'restore':
      return action.state
  }
}

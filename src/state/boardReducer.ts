import type { BoardState, ColumnId, Item } from '../types'

export type BoardAction = { type: 'add'; item: Item } | { type: 'remove'; id: string }

export const initialBoard: BoardState = {
  items: {},
  columns: { todo: [], doing: [], done: [] },
}

export function findColumn(state: BoardState, id: string): ColumnId | undefined {
  if (id in state.columns) return id as ColumnId
  return (Object.keys(state.columns) as ColumnId[]).find((col) => state.columns[col].includes(id))
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
  }
}

import { COLUMNS, type BoardState } from '../types'
import { boardReducer, findColumn, initialBoard, type BoardAction } from './boardReducer'

export const HISTORY_LIMIT = 10

export type HistoryState = {
  // Boards to go back to, oldest first. At most HISTORY_LIMIT.
  past: BoardState[]
  present: BoardState
  // The board at pick-up while a drag is in progress. A drag dispatches several moves; this
  // is what makes them one step to undo.
  dragStart: BoardState | null
}

export type HistoryAction =
  | BoardAction
  | { type: 'dragStart' }
  | { type: 'dragEnd' }
  | { type: 'dragCancel' }
  | { type: 'undo' }

export const initialHistory: HistoryState = { past: [], present: initialBoard, dragStart: null }

function record(past: BoardState[], board: BoardState): BoardState[] {
  return [...past, board].slice(-HISTORY_LIMIT)
}

// By content: a card carried to another column and back leaves new arrays in the same order.
function sameOrder(a: BoardState, b: BoardState): boolean {
  return COLUMNS.every(({ id }) => {
    const ids = a.columns[id]
    const other = b.columns[id]
    return ids.length === other.length && ids.every((card, i) => card === other[i])
  })
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'dragStart':
      return { ...state, dragStart: state.present }

    case 'dragEnd': {
      const { dragStart, present } = state
      if (!dragStart) return state
      if (sameOrder(dragStart, present)) return { ...state, present: dragStart, dragStart: null }
      return { past: record(state.past, dragStart), present, dragStart: null }
    }

    case 'dragCancel':
      if (!state.dragStart) return state
      return { ...state, present: state.dragStart, dragStart: null }

    case 'undo': {
      const previous = state.past[state.past.length - 1]
      if (!previous || state.dragStart) return state
      return { past: state.past.slice(0, -1), present: previous, dragStart: null }
    }

    default: {
      const present = boardReducer(state.present, action)
      if (present === state.present) return state
      // Mid-drag moves are not steps of their own; dragEnd records the whole drag.
      if (state.dragStart) return { ...state, present }
      return { ...state, past: record(state.past, state.present), present }
    }
  }
}

/** Names the one change that turned `before` into `after`, for the undo announcement. */
export function describeChange(before: BoardState, after: BoardState): string {
  const added = Object.keys(after.items).find((id) => !(id in before.items))
  if (added) return `added ${after.items[added].title}`

  const deleted = Object.keys(before.items).find((id) => !(id in after.items))
  if (deleted) return `deleted ${before.items[deleted].title}`

  for (const { id: column, title } of COLUMNS) {
    const moved = after.columns[column].find((id) => findColumn(before, id) !== column)
    if (moved) return `moved ${after.items[moved].title} to ${title}`
  }

  for (const { id: column, title } of COLUMNS) {
    // Reordered: the card that, taken out of both orders, leaves them equal.
    const ids = after.columns[column]
    const was = before.columns[column]
    const reordered = was.find((id, i) => {
      if (ids[i] === id) return false
      const rest = ids.filter((other) => other !== id)
      return was.filter((other) => other !== id).every((other, j) => other === rest[j])
    })
    if (reordered) return `reordered ${after.items[reordered].title} in ${title}`
  }
  return 'the last change'
}

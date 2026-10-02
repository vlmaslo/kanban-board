import type { Dispatch } from 'react'
import { COLUMNS, type BoardState, type ColumnId } from '../../types'
import type { BoardAction } from '../../state/boardReducer'
import { Column } from '../Column'

type Props = {
  board: BoardState
  dispatch: Dispatch<BoardAction>
}

export function Board({ board, dispatch }: Props) {
  return (
    // One column per row on narrow screens, so nothing needs sideways scrolling.
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => (
        <Column
          key={col.id}
          id={col.id as ColumnId}
          title={col.title}
          items={board.columns[col.id].map((id) => board.items[id])}
          onRemove={(id) => dispatch({ type: 'remove', id })}
        />
      ))}
    </div>
  )
}

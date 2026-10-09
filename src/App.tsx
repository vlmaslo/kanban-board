import { useReducer, useState } from 'react'
import { Board } from './components/Board'
import { NewItemForm } from './components/NewItemForm'
import { describeChange, historyReducer, initialHistory } from './state/historyReducer'
import { buttonClass } from './lib/ui'

export default function App() {
  const [history, dispatch] = useReducer(historyReducer, initialHistory)
  const [announcement, setAnnouncement] = useState('')

  const previous = history.past[history.past.length - 1]
  const canUndo = !!previous && !history.dragStart

  function handleUndo() {
    if (!canUndo) return
    setAnnouncement(`Undid: ${describeChange(previous, history.present)}.`)
    dispatch({ type: 'undo' })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-12">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rick and Morty Kanban</h1>
          <p className="text-muted">Drag cards between columns. Finish something to celebrate.</p>
        </div>
        {/* aria-disabled, not disabled: the button keeps focus after the last undo. */}
        <button
          type="button"
          className={buttonClass.secondary}
          aria-disabled={!canUndo}
          onClick={handleUndo}
        >
          Undo
        </button>
        {/* The board changes without focus moving, so say what was undone. */}
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </header>

      <main className="grid items-start gap-5 grid-cols-1 lg:grid-cols-[20rem_1fr]">
        <aside>
          <NewItemForm onCreate={(item) => dispatch({ type: 'add', item })} />
        </aside>
        <Board board={history.present} dispatch={dispatch} />
      </main>
    </div>
  )
}

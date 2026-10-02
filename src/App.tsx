import { useReducer } from 'react'
import { Board } from './components/Board'
import { NewItemForm } from './components/NewItemForm'
import { boardReducer, initialBoard } from './state/boardReducer'

export default function App() {
  const [board, dispatch] = useReducer(boardReducer, initialBoard)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 pb-12">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
      </header>

      <main className="grid items-start gap-5 grid-cols-1 lg:grid-cols-[20rem_1fr]">
        <aside>
          <NewItemForm onCreate={(item) => dispatch({ type: 'add', item })} />
        </aside>
        <Board board={board} dispatch={dispatch} />
      </main>
    </div>
  )
}

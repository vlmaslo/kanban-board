import { useReducer } from 'react'
import { Board } from './components/Board'
import { boardReducer, initialBoard } from './state/boardReducer'

export default function App() {
  const [board, dispatch] = useReducer(boardReducer, initialBoard)

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 pb-12">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
      </header>

      <main>
        <Board board={board} dispatch={dispatch} />
      </main>
    </div>
  )
}

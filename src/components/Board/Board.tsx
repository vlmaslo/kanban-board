import { useEffect, useRef, useState, type Dispatch } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { COLUMNS, type BoardState, type ColumnId } from '../../types'
import { enteredDone, findColumn, type BoardAction } from '../../state/boardReducer'
import { celebrate } from '../../lib/celebrate'
import { boardKeyboardCoordinates } from '../../lib/keyboardCoordinates'
import { Column } from '../Column'
import { CardView } from '../CardView'

const columnTitle = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title])) as Record<
  ColumnId,
  string
>

// Read out by screen readers when a card gets focus.
const screenReaderInstructions = {
  draggable:
    'To move this card, press Space or Enter. Use the arrow keys to move it within and between ' +
    'columns, Space or Enter again to drop it, or Escape to cancel.',
}

type Props = {
  board: BoardState
  dispatch: Dispatch<BoardAction>
}

export function Board({ board, dispatch }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  // Board as it was when the drag began: lets us cancel, and tells us where the card came from.
  const snapshot = useRef<BoardState | null>(null)

  const sensors = useSensors(
    // A small distance threshold keeps a click on a card from starting a drag.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // On touch, press and hold to pick a card up; a plain swipe still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!celebratingId) return
    const t = setTimeout(() => setCelebratingId(null), 1200)
    return () => clearTimeout(t)
  }, [celebratingId])

  // Pointer-first: a column catches the card as soon as the cursor enters it. dnd-kit's
  // closestCorners averages corner distances, so a tall empty column loses to the cards beside
  // it.
  const collisionDetection: CollisionDetection = (args) => {
    // Keyboard drags have no pointer, so pointerWithin finds nothing and the card's overlap decides.
    const hits = pointerWithin(args)
    const overId = getFirstCollision(hits.length > 0 ? hits : rectIntersection(args), 'id')
    if (overId == null) return []

    // Over a column's gap or padding: snap to its nearest card so the drop index is meaningful.
    const overKey = String(overId)
    if (overKey in board.columns) {
      const cardIds = board.columns[overKey as ColumnId]
      const cards = args.droppableContainers.filter((c) => cardIds.includes(String(c.id)))
      const nearest = closestCenter({ ...args, droppableContainers: cards })[0]
      if (nearest) return [nearest]
    }
    return [{ id: overId }]
  }

  function handleDragStart({ active }: DragStartEvent) {
    snapshot.current = board
    setActiveId(String(active.id))
  }

  // Cross-column moves happen live during the drag so the target column opens a gap.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeKey = String(active.id)
    const overKey = String(over.id)
    const from = findColumn(board, activeKey)
    const to = findColumn(board, overKey)
    if (!from || !to || from === to) return

    const target = board.columns[to]
    const overIsColumn = overKey === to
    let index = target.length
    if (!overIsColumn) {
      const overIndex = target.indexOf(overKey)
      const activeTop = active.rect.current.translated?.top ?? 0
      const isBelow = activeTop > over.rect.top + over.rect.height / 2
      index = overIndex + (isBelow ? 1 : 0)
    }
    dispatch({ type: 'move', id: activeKey, to, index })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const activeKey = String(active.id)
    const origin = snapshot.current ? findColumn(snapshot.current, activeKey) : undefined
    setActiveId(null)

    if (!over) {
      handleDragCancel()
      return
    }
    snapshot.current = null

    const column = findColumn(board, activeKey)
    const overKey = String(over.id)
    if (column && findColumn(board, overKey) === column) {
      const ids = board.columns[column]
      const index = overKey === column ? ids.length - 1 : ids.indexOf(overKey)
      dispatch({ type: 'move', id: activeKey, to: column, index })
    }

    if (enteredDone(origin, column)) {
      const rect = active.rect.current.translated
      celebrate(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined)
      setCelebratingId(activeKey)
    }
  }

  function handleDragCancel() {
    if (snapshot.current) dispatch({ type: 'restore', state: snapshot.current })
    snapshot.current = null
    setActiveId(null)
  }

  // dnd-kit's default announcements read out raw ids; these use titles and column names.
  const describe = (id: string | number) => board.items[String(id)]?.title ?? 'The card'
  const columnOf = (id: string | number) => {
    const column = findColumn(board, String(id))
    return column ? columnTitle[column] : null
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${describe(active.id)} in ${columnOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${describe(active.id)} is over ${columnOf(over.id)}.`
        : `${describe(active.id)} is not over a column.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${describe(active.id)} was dropped in ${columnOf(over.id)}.`
        : `${describe(active.id)} was dropped outside the board and put back.`,
    onDragCancel: ({ active }) => `Moving ${describe(active.id)} was cancelled. It was put back.`,
  }

  const activeItem = activeId ? board.items[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* One column per row on narrow screens, so nothing needs sideways scrolling (WCAG 1.4.10). */}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id as ColumnId}
            title={col.title}
            items={board.columns[col.id].map((id) => board.items[id])}
            celebratingId={celebratingId}
            onRemove={(id) => dispatch({ type: 'remove', id })}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <CardView item={activeItem} variant="dragging" /> : null}
      </DragOverlay>
    </DndContext>
  )
}

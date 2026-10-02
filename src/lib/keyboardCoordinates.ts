import type { KeyboardCoordinateGetter } from '@dnd-kit/core'
import { hasSortableData, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { COLUMNS } from '../types'

// Matches the column list's padding, so the card lands on the first card slot.
const COLUMN_INSET = 8

/**
 * Keyboard movement for the board. Up and Down use dnd-kit's sortable behaviour. Left and Right
 * jump to the neighbouring column.
 *
 * dnd-kit's own getter picks "the closest drop target further left/right", which goes wrong
 * here: cards sit a few pixels inside their column, so the nearest target to the left of a card
 * is its own column, and the nearest to the right can be the card above it.
 */
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const step = event.code === 'ArrowRight' ? 1 : event.code === 'ArrowLeft' ? -1 : 0
  if (step === 0) return sortableKeyboardCoordinates(event, args)

  event.preventDefault()
  const { active, droppableContainers, droppableRects } = args.context
  // The card's SortableContext id is its current column, kept up to date while dragging.
  const entry = active ? droppableContainers.get(active.id) : undefined
  if (!hasSortableData(entry)) return undefined

  const current = COLUMNS.findIndex((c) => c.id === entry.data.current.sortable.containerId)
  const target = COLUMNS[current + step]
  const rect = current !== -1 && target ? droppableRects.get(target.id) : undefined
  if (!rect) return undefined

  return { x: rect.left + COLUMN_INSET, y: rect.top + COLUMN_INSET }
}

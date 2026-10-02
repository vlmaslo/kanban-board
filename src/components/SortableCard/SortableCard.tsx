import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Item } from '../../types'
import { CardView } from '../CardView'

type Props = {
  item: Item
  celebrating: boolean
  completed?: boolean
  onRemove: (id: string) => void
}

export function SortableCard({ item, celebrating, completed, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  return (
    // The list item keeps its own role. The card body inside it is the draggable "button".
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('rounded-lg', isDragging && 'opacity-35')}
    >
      <CardView
        item={item}
        onRemove={() => onRemove(item.id)}
        variant={celebrating ? 'celebrating' : 'default'}
        completed={completed}
        drag={{ ref: setActivatorNodeRef, ...attributes, ...listeners }}
      />
    </li>
  )
}

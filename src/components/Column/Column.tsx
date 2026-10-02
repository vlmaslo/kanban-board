import clsx from 'clsx'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ColumnId, Item } from '../../types'
import { SortableCard } from '../SortableCard'

type Props = {
  id: ColumnId
  title: string
  items: Item[]
  celebratingId: string | null
  onRemove: (id: string) => void
}

export function Column({ id, title, items, celebratingId, onRemove }: Props) {
  // Makes the column itself a drop target so empty columns accept cards.
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <section
      className="flex min-h-40 flex-col rounded-xl bg-surface-2 md:min-h-[60vh]"
      aria-labelledby={`col-${id}`}
      data-over={isOver || undefined}
    >
      <header className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <h2 id={`col-${id}`} className="text-sm font-bold tracking-wider uppercase">
          {title}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
          {items.length}
        </span>
      </header>

      <SortableContext
        id={id}
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul
          ref={setNodeRef}
          className={clsx(
            'flex flex-1 flex-col gap-2 rounded-b-xl p-2 transition-colors',
            // A ring, not a darker fill, so text inside keeps its contrast while hovering.
            isOver && 'ring-2 ring-control ring-inset',
          )}
        >
          {items.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              celebrating={item.id === celebratingId}
              completed={id === 'done'}
              onRemove={onRemove}
            />
          ))}
          {items.length === 0 && (
            <li className="rounded-lg border-2 border-dashed border-line px-2 py-6 text-center text-sm text-muted">
              Drop items here
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  )
}

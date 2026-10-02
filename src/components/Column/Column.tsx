import type { ColumnId, Item } from '../../types'
import { CardView } from '../CardView'

type Props = {
  id: ColumnId
  title: string
  items: Item[]
  onRemove: (id: string) => void
}

export function Column({ id, title, items, onRemove }: Props) {
  return (
    <section
      className="flex min-h-40 flex-col rounded-xl bg-surface-2 md:min-h-[60vh]"
      aria-labelledby={`col-${id}`}
    >
      <header className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <h2 id={`col-${id}`} className="text-sm font-bold tracking-wider uppercase">
          {title}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
          {items.length}
        </span>
      </header>

      <ul className="flex flex-1 flex-col gap-2 rounded-b-xl p-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg">
            <CardView item={item} completed={id === 'done'} onRemove={() => onRemove(item.id)} />
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-lg border-2 border-dashed border-line px-2 py-6 text-center text-sm text-muted">
            No items yet
          </li>
        )}
      </ul>
    </section>
  )
}

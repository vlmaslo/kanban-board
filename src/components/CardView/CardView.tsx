import clsx from 'clsx'
import type { HTMLAttributes, Ref } from 'react'
import type { Character, Item } from '../../types'
import { focusRing } from '../../lib/ui'

export type CardVariant = 'default' | 'dragging' | 'celebrating'

export type DragProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }

type Props = {
  item: Item
  onRemove?: () => void
  variant?: CardVariant
  /** Rendered in the Done column. */
  completed?: boolean
  /** Makes the card body the draggable element. Without it the card is static. */
  drag?: DragProps
}

// Decorative: the status is also written out next to the name.
const statusDot: Record<Character['status'], string> = {
  Alive: 'before:bg-ink',
  Dead: 'before:bg-muted',
  unknown: 'before:bg-line',
}

/** Pure presentational card — used both in columns and in the DragOverlay. */
export function CardView({ item, onRemove, variant = 'default', completed = false, drag }: Props) {
  const { character } = item
  return (
    <article
      data-state={variant}
      data-completed={completed || undefined}
      className={clsx(
        'relative rounded-lg border border-line bg-surface shadow-card',
        variant === 'dragging' && 'rotate-2 cursor-grabbing shadow-lifted',
        variant === 'celebrating' && 'motion-safe:animate-celebrate',
      )}
    >
      {/* The draggable part. The delete button is its sibling, not its child: a button inside
          a button is invalid, and assistive tech would not reach it. */}
      <div
        {...drag}
        aria-label={drag ? `${item.title}, assigned to ${character.name}` : undefined}
        className={clsx('flex gap-2.5 rounded-lg p-2.5', drag && ['cursor-grab', focusRing])}
      >
        <img
          className={clsx(
            'size-11 shrink-0 rounded-full object-cover',
            variant === 'celebrating' && 'motion-safe:animate-spin-once',
          )}
          src={character.image}
          alt=""
          width={44}
          height={44}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3
            className={clsx(
              'pr-6 text-[0.95rem] font-semibold wrap-anywhere',
              completed && 'line-through text-muted',
            )}
          >
            {item.title}
          </h3>
          {item.description && (
            <p className="text-[0.8125rem] text-muted wrap-anywhere">{item.description}</p>
          )}
          <p
            className={clsx(
              'inline-flex flex-wrap items-center gap-x-1.5 text-xs',
              "before:size-[7px] before:rounded-full before:content-['']",
              statusDot[character.status],
            )}
          >
            <span className="font-semibold">{character.name}</span>
            <span className="text-muted">{character.status}</span>
          </p>
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          className={clsx(
            'absolute top-1 right-1 grid size-6 cursor-pointer place-items-center rounded-md text-lg leading-none text-muted',
            'hover:bg-surface-2 hover:text-ink',
            focusRing,
          )}
          aria-label={`Delete ${item.title}`}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </article>
  )
}

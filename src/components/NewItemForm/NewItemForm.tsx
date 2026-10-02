import clsx from 'clsx'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useCharacters } from '../../hooks/useCharacters'
import type { Item } from '../../types'
import { buttonClass, focusRing, inputClass, labelClass } from '../../lib/ui'

type Props = {
  onCreate: (item: Item) => void
}

export function NewItemForm({ onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [characterId, setCharacterId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const loaded = useCharacters()
  const characters = loaded.status === 'success' ? loaded.characters : []
  const character = characters.find((c) => c.id === characterId) ?? null

  const errors = {
    title: title.trim() ? null : 'Give the task a title',
    character: character ? null : 'Assign a character',
  }
  const isValid = !errors.title && !errors.character
  const titleErrorId = useId()
  const showTitleError = submitted && !!errors.title
  const characterLabelId = useId()
  const characterErrorId = useId()
  const showCharacterError = submitted && !!errors.character

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!isValid || !character) return

    onCreate({
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      // The item keeps its own copy, so a card renders without the character list.
      character,
    })
    setTitle('')
    setDescription('')
    setCharacterId('')
    setSubmitted(false)
    // Ready for the next item without reaching for the mouse.
    titleRef.current?.focus()
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-card lg:sticky lg:top-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <h2 className="text-lg font-bold">New item</h2>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>
          Title
          <input
            ref={titleRef}
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Get schwifty"
            aria-invalid={showTitleError}
            aria-describedby={showTitleError ? titleErrorId : undefined}
          />
        </label>
        {showTitleError && (
          <small id={titleErrorId} className="text-xs font-semibold text-ink">
            {errors.title}
          </small>
        )}
      </div>

      <label className={labelClass}>
        <span>
          Description <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          className={clsx(inputClass, 'resize-y')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span id={characterLabelId} className={labelClass}>
          Character
        </span>
        {/* Native radios: arrow keys, focus and form semantics come for free. */}
        <div
          role="radiogroup"
          aria-labelledby={characterLabelId}
          aria-invalid={showCharacterError}
          aria-describedby={showCharacterError ? characterErrorId : undefined}
          className={clsx(
            'grid max-h-60 gap-0.5 overflow-y-auto rounded-lg border border-control p-1',
            showCharacterError && 'border-ink',
          )}
        >
          {loaded.status === 'loading' && (
            <p className="px-1.5 py-2 text-sm text-muted">Loading characters…</p>
          )}
          {loaded.status === 'error' && (
            <p role="alert" className="flex items-center justify-between gap-2 p-1.5 text-xs">
              <span className="font-semibold text-ink">
                Could not load characters: {loaded.error}
              </span>
              <button
                type="button"
                className={clsx(
                  'min-h-6 cursor-pointer rounded-md px-1 font-semibold text-ink underline underline-offset-2',
                  focusRing,
                )}
                onClick={loaded.retry}
              >
                Retry
              </button>
            </p>
          )}
          {characters.map((c) => (
            <label
              key={c.id}
              className={clsx(
                'flex cursor-pointer items-center gap-2 rounded-md p-1 text-sm',
                'hover:bg-surface-2 has-checked:bg-surface-2 has-checked:font-semibold',
                'has-checked:ring-2 has-checked:ring-accent has-checked:ring-inset',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={characterLabelId}
                value={c.id}
                checked={c.id === characterId}
                onChange={() => setCharacterId(c.id)}
              />
              <img
                className="size-8 shrink-0 rounded-full object-cover"
                src={c.image}
                alt=""
                width={32}
                height={32}
                loading="lazy"
              />
              <span className="flex-1">{c.name}</span>
              <small className="font-normal text-muted">{c.species}</small>
            </label>
          ))}
        </div>
        {showCharacterError && (
          <small id={characterErrorId} className="text-xs font-semibold text-ink">
            {errors.character}
          </small>
        )}
      </div>

      <button type="submit" className={buttonClass.primary}>
        Add to To Do
      </button>
    </form>
  )
}

// Shared class lists for native elements used across components.

export const inputClass =
  'w-full rounded-lg border border-control bg-surface px-2.5 py-2 text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'aria-invalid:border-ink'

export const labelClass = 'flex flex-col gap-1 text-sm font-semibold'

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export const buttonClass = {
  primary: `cursor-pointer rounded-lg bg-accent px-3.5 py-2 font-semibold text-accent-contrast hover:opacity-85 ${focusRing}`,
  // Unavailable is shown by a dashed border as well as muted text, not by shade alone.
  secondary:
    'cursor-pointer rounded-lg border border-control bg-surface px-3.5 py-2 font-semibold text-ink ' +
    'hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:border-dashed ' +
    `aria-disabled:text-muted aria-disabled:hover:bg-surface ${focusRing}`,
}

import { useCallback, useEffect, useState } from 'react'
import { fetchCharacters } from '../api/rickAndMorty'
import type { Character } from '../types'

type CharactersState = (
  | { status: 'loading' }
  | { status: 'success'; characters: Character[] }
  | { status: 'error'; error: string }
) & {
  /** Load the list again after an error. */
  retry: () => void
}

type Result = { characters: Character[] } | { error: string }

/** Loads the characters an item can be assigned to. */
export function useCharacters(): CharactersState {
  const [result, setResult] = useState<Result | null>(null)
  // Bumped by retry() to re-run the effect.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchCharacters(controller.signal)
      .then((characters) => setResult({ characters }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setResult({ error: err instanceof Error ? err.message : 'Something went wrong' })
      })

    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    // Dropping the failed result puts the hook back into "loading".
    setResult(null)
    setAttempt((n) => n + 1)
  }, [])

  if (!result) return { status: 'loading', retry }
  if ('error' in result) return { status: 'error', error: result.error, retry }
  return { status: 'success', characters: result.characters, retry }
}

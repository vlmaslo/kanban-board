import type { Character } from '../types'

const ENDPOINT = 'https://rickandmortyapi.com/graphql'

// No arguments: the API returns its first page of 20 characters.
const CHARACTERS_QUERY = /* GraphQL */ `
  query Characters {
    characters {
      results {
        id
        name
        image
        species
        status
      }
    }
  }
`

type CharactersResponse = {
  data?: { characters: { results: Character[] } | null }
  errors?: { message: string }[]
}

export async function fetchCharacters(signal?: AbortSignal): Promise<Character[]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CHARACTERS_QUERY }),
    signal,
  })

  if (!res.ok) throw new Error(`Request failed (${res.status})`)

  // GraphQL reports query errors with HTTP 200 and an `errors` array.
  const json = (await res.json()) as CharactersResponse
  const characters = json.data?.characters

  if (!characters) throw new Error(json.errors?.[0]?.message ?? 'Unknown API error')

  return characters.results
}

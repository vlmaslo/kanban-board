export type Character = {
  id: string
  name: string
  image: string
  species: string
  status: 'Alive' | 'Dead' | 'unknown'
}

export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
] as const

export type ColumnId = (typeof COLUMNS)[number]['id']

export type Item = {
  id: string
  title: string
  description: string
  character: Character
}

export type BoardState = {
  items: Record<string, Item>
  // Order lives on the column, so reordering never touches the item itself.
  columns: Record<ColumnId, string[]>
}

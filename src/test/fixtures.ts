import type { BoardState, Character, Item } from '../types'

export const rick: Character = {
  id: '1',
  name: 'Rick Sanchez',
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  species: 'Human',
  status: 'Alive',
}

export const morty: Character = {
  id: '2',
  name: 'Morty Smith',
  image: 'https://rickandmortyapi.com/api/character/avatar/2.jpeg',
  species: 'Human',
  status: 'Alive',
}

export const birdperson: Character = {
  id: '47',
  name: 'Birdperson',
  image: 'https://rickandmortyapi.com/api/character/avatar/47.jpeg',
  species: 'Alien',
  status: 'Dead',
}

export const characters = [rick, morty, birdperson]

export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    title: 'Get schwifty',
    description: 'Show me what you got',
    character: rick,
    ...overrides,
  }
}

const items = [
  makeItem({ id: 'a', title: 'Build portal gun', character: rick }),
  makeItem({ id: 'b', title: 'Pass math test', description: '', character: morty }),
  makeItem({ id: 'c', title: 'Find the Council of Ricks', character: birdperson }),
  makeItem({
    id: 'd',
    title: 'Pickle transformation',
    description: 'Funniest thing ever',
    character: rick,
  }),
]

export const sampleBoard: BoardState = {
  items: Object.fromEntries(items.map((i) => [i.id, i])),
  columns: { todo: ['a', 'b'], doing: ['c'], done: ['d'] },
}

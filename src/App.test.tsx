import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { fetchCharacters } from './api/rickAndMorty'
import { characters } from './test/fixtures'

vi.mock('./api/rickAndMorty', () => ({ fetchCharacters: vi.fn() }))

const undo = () => screen.getByRole('button', { name: 'Undo' })

function titlesIn(column: string) {
  const region = screen.getByRole('region', { name: column })
  return within(region)
    .queryAllByRole('heading', { level: 3 })
    .map((h) => h.textContent)
}

async function addCard(title: string) {
  await userEvent.type(screen.getByLabelText('Title'), title)
  await userEvent.click(await screen.findByRole('radio', { name: /morty smith/i }))
  await userEvent.click(screen.getByRole('button', { name: 'Add to To Do' }))
}

beforeEach(() => {
  vi.mocked(fetchCharacters).mockReset().mockResolvedValue(characters)
})

describe('App undo', () => {
  it('has nothing to undo on an empty board', async () => {
    render(<App />)
    await screen.findByRole('radio', { name: /morty smith/i })
    expect(undo()).toHaveAttribute('aria-disabled', 'true')
  })

  it('undoes creating a card and says so', async () => {
    render(<App />)
    await addCard('Alpha')
    expect(titlesIn('To Do')).toEqual(['Alpha'])
    expect(undo()).toHaveAttribute('aria-disabled', 'false')

    await userEvent.click(undo())

    expect(titlesIn('To Do')).toEqual([])
    expect(screen.getByText('Undid: added Alpha.')).toHaveRole('status')
    expect(undo()).toHaveAttribute('aria-disabled', 'true')
    // Still focused, so a keyboard user is not sent back to the top of the page.
    expect(undo()).toHaveFocus()
  })

  it('undoes deleting a card, back to its place', async () => {
    render(<App />)
    await addCard('Alpha')
    await addCard('Beta')
    await userEvent.click(screen.getByRole('button', { name: 'Delete Alpha' }))
    expect(titlesIn('To Do')).toEqual(['Beta'])

    await userEvent.click(undo())

    expect(titlesIn('To Do')).toEqual(['Beta', 'Alpha'])
    expect(screen.getByText('Undid: deleted Alpha.')).toBeInTheDocument()
  })
})

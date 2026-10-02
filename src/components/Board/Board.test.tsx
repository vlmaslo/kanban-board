import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { initialBoard } from '../../state/boardReducer'
import { sampleBoard } from '../../test/fixtures'
import { Board } from './Board'

vi.mock('../../lib/celebrate', () => ({ celebrate: vi.fn() }))

function titlesIn(column: string) {
  const region = screen.getByRole('region', { name: column })
  return within(region)
    .queryAllByRole('heading', { level: 3 })
    .map((h) => h.textContent)
}

describe('Board', () => {
  it('renders the three columns in order', () => {
    render(<Board board={initialBoard} dispatch={vi.fn()} />)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['To Do', 'Doing', 'Done'])
  })

  it('places each item in its column, in order', () => {
    render(<Board board={sampleBoard} dispatch={vi.fn()} />)
    expect(titlesIn('To Do')).toEqual(['Build portal gun', 'Pass math test'])
    expect(titlesIn('Doing')).toEqual(['Find the Council of Ricks'])
    expect(titlesIn('Done')).toEqual(['Pickle transformation'])
  })

  it('dispatches remove when a card is deleted', async () => {
    const dispatch = vi.fn()
    render(<Board board={sampleBoard} dispatch={dispatch} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete Pass math test' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'remove', id: 'b' })
  })
})

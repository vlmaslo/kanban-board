import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCharacters } from '../../api/rickAndMorty'
import { characters, morty } from '../../test/fixtures'
import { NewItemForm } from './NewItemForm'

vi.mock('../../api/rickAndMorty', () => ({ fetchCharacters: vi.fn() }))
const mockFetch = vi.mocked(fetchCharacters)

const characterList = () => screen.getByRole('radiogroup', { name: 'Character' })
const mortyOption = () => screen.findByRole('radio', { name: /morty smith/i })

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue(characters)
})

describe('NewItemForm', () => {
  it('lists the fetched characters', async () => {
    render(<NewItemForm onCreate={vi.fn()} />)
    expect(characterList()).toHaveTextContent('Loading characters…')

    expect(await mortyOption()).not.toBeChecked()
    expect(screen.getAllByRole('radio')).toHaveLength(characters.length)
  })

  it('offers a retry when the characters fail to load', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Request failed (500)'))
    render(<NewItemForm onCreate={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (500)')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await mortyOption()).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('does not show errors until the user submits', async () => {
    const onCreate = vi.fn()
    render(<NewItemForm onCreate={onCreate} />)
    await mortyOption()
    expect(screen.queryByText('Give the task a title')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Add to To Do' }))
    expect(screen.getByText('Give the task a title')).toBeInTheDocument()
    expect(screen.getByText('Assign a character')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
    expect(characterList()).toHaveAttribute('aria-invalid', 'true')
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('requires a character even when a title is given', async () => {
    const onCreate = vi.fn()
    render(<NewItemForm onCreate={onCreate} />)
    await mortyOption()
    await userEvent.type(screen.getByLabelText('Title'), 'Save Morty')
    await userEvent.click(screen.getByRole('button', { name: 'Add to To Do' }))
    expect(screen.queryByText('Give the task a title')).not.toBeInTheDocument()
    expect(screen.getByText('Assign a character')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('creates a trimmed item with the chosen character and resets', async () => {
    const onCreate = vi.fn()
    render(<NewItemForm onCreate={onCreate} />)
    await mortyOption()

    await userEvent.type(screen.getByLabelText('Title'), '  Save Morty  ')
    await userEvent.type(screen.getByLabelText(/description/i), 'From the Cronenbergs')
    await userEvent.click(await mortyOption())
    expect(await mortyOption()).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Add to To Do' }))

    expect(onCreate).toHaveBeenCalledOnce()
    expect(onCreate.mock.calls[0][0]).toMatchObject({
      id: expect.any(String),
      title: 'Save Morty',
      description: 'From the Cronenbergs',
      character: morty,
    })
    expect(screen.getByLabelText('Title')).toHaveValue('')
    expect(screen.getByLabelText('Title')).toHaveFocus()
    expect(screen.getByLabelText(/description/i)).toHaveValue('')
    expect(await mortyOption()).not.toBeChecked()
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { birdperson, makeItem } from '../../test/fixtures'
import { CardView } from './CardView'

describe('CardView', () => {
  it('renders title, description and assigned character', () => {
    render(<CardView item={makeItem()} />)
    expect(screen.getByRole('heading', { name: 'Get schwifty' })).toBeInTheDocument()
    expect(screen.getByText('Show me what you got')).toBeInTheDocument()
    expect(screen.getByText('Rick Sanchez')).toBeInTheDocument()
  })

  it('omits the description when empty', () => {
    render(<CardView item={makeItem({ description: '' })} />)
    expect(screen.queryByText('Show me what you got')).not.toBeInTheDocument()
  })

  it('reflects character status', () => {
    render(<CardView item={makeItem({ character: birdperson })} />)
    // Written out, not only shown by the colour of the dot.
    expect(screen.getByText('Dead')).toBeInTheDocument()
  })

  it('exposes its visual state', () => {
    const { rerender } = render(<CardView item={makeItem()} />)
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('data-state', 'default')
    expect(card).not.toHaveAttribute('data-completed')

    rerender(<CardView item={makeItem()} variant="celebrating" completed />)
    expect(card).toHaveAttribute('data-state', 'celebrating')
    expect(card).toHaveAttribute('data-completed')
  })

  it('names the draggable body and keeps the delete button outside it', () => {
    const { rerender } = render(<CardView item={makeItem()} onRemove={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(1)

    rerender(<CardView item={makeItem()} onRemove={vi.fn()} drag={{ role: 'button' }} />)
    const body = screen.getByRole('button', { name: 'Get schwifty, assigned to Rick Sanchez' })
    const remove = screen.getByRole('button', { name: 'Delete Get schwifty' })
    // A button inside a button is invalid and unreachable for assistive tech.
    expect(body).not.toContainElement(remove)
  })

  it('only shows a delete button when onRemove is provided', async () => {
    const { rerender } = render(<CardView item={makeItem()} />)
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()

    const onRemove = vi.fn()
    rerender(<CardView item={makeItem()} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete Get schwifty' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })
})

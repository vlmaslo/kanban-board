import type { ReactNode } from 'react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeItem } from '../../test/fixtures'
import { SortableCard } from './SortableCard'

const item = makeItem({ id: 'x1' })

function wrapper({ children }: { children: ReactNode }) {
  return (
    <DndContext>
      <SortableContext items={[item.id]}>
        <ul>{children}</ul>
      </SortableContext>
    </DndContext>
  )
}

describe('SortableCard', () => {
  it('keeps the list item and exposes the card body as a named, focusable sortable', () => {
    render(<SortableCard item={item} celebrating={false} onRemove={vi.fn()} />, { wrapper })
    expect(screen.getByRole('listitem')).toBeInTheDocument()
    const body = screen.getByRole('button', { name: 'Get schwifty, assigned to Rick Sanchez' })
    expect(body).toHaveAttribute('aria-roledescription', 'sortable')
    expect(body).toHaveAttribute('tabindex', '0')
  })

  it('calls onRemove with the item id', async () => {
    const onRemove = vi.fn()
    render(<SortableCard item={item} celebrating={false} onRemove={onRemove} />, { wrapper })
    await userEvent.click(screen.getByRole('button', { name: 'Delete Get schwifty' }))
    expect(onRemove).toHaveBeenCalledWith('x1')
  })

  it('applies the celebration animation', () => {
    render(<SortableCard item={item} celebrating onRemove={vi.fn()} />, { wrapper })
    expect(screen.getByRole('article')).toHaveAttribute('data-state', 'celebrating')
  })
})

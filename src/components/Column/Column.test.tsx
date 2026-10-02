import type { ReactNode } from 'react'
import { DndContext } from '@dnd-kit/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeItem } from '../../test/fixtures'
import { Column } from './Column'

const wrapper = ({ children }: { children: ReactNode }) => <DndContext>{children}</DndContext>

const items = [makeItem({ id: 'a', title: 'First' }), makeItem({ id: 'b', title: 'Second' })]

describe('Column', () => {
  it('renders a labelled region with an item count', () => {
    render(
      <Column id="doing" title="Doing" items={items} celebratingId={null} onRemove={vi.fn()} />,
      { wrapper },
    )
    const region = screen.getByRole('region', { name: 'Doing' })
    expect(within(region).getByText('2')).toBeInTheDocument()
  })

  it('renders items in order', () => {
    render(
      <Column id="todo" title="To Do" items={items} celebratingId={null} onRemove={vi.fn()} />,
      { wrapper },
    )
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['First', 'Second'])
  })

  it('shows a drop hint when empty', () => {
    render(<Column id="done" title="Done" items={[]} celebratingId={null} onRemove={vi.fn()} />, {
      wrapper,
    })
    expect(screen.getByText('Drop items here')).toBeInTheDocument()
  })

  it('forwards removal of an item', async () => {
    const onRemove = vi.fn()
    render(
      <Column id="todo" title="To Do" items={items} celebratingId={null} onRemove={onRemove} />,
      { wrapper },
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete Second' }))
    expect(onRemove).toHaveBeenCalledWith('b')
  })

  it('marks only the celebrating item', () => {
    render(<Column id="done" title="Done" items={items} celebratingId="b" onRemove={vi.fn()} />, {
      wrapper,
    })
    const [first, second] = screen.getAllByRole('article')
    expect(first).toHaveAttribute('data-state', 'default')
    expect(second).toHaveAttribute('data-state', 'celebrating')
  })

  it('marks cards as completed only in Done', () => {
    const { rerender } = render(
      <Column id="doing" title="Doing" items={items} celebratingId={null} onRemove={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getAllByRole('article')[0]).not.toHaveAttribute('data-completed')

    rerender(
      <Column id="done" title="Done" items={items} celebratingId={null} onRemove={vi.fn()} />,
    )
    expect(screen.getAllByRole('article')[0]).toHaveAttribute('data-completed')
  })
})

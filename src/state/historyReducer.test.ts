import { describe, expect, it } from 'vitest'
import { makeItem, sampleBoard } from '../test/fixtures'
import {
  HISTORY_LIMIT,
  describeChange,
  historyReducer,
  type HistoryAction,
  type HistoryState,
} from './historyReducer'

const start: HistoryState = { past: [], present: sampleBoard, dragStart: null }

const run = (actions: HistoryAction[], from = start) => actions.reduce(historyReducer, from)

describe('historyReducer', () => {
  it.each<[string, HistoryAction]>([
    ['creating a card', { type: 'add', item: makeItem({ id: 'new' }) }],
    ['deleting a card', { type: 'remove', id: 'c' }],
    ['moving a card to another column', { type: 'move', id: 'a', to: 'done', index: 0 }],
    ['reordering a card', { type: 'move', id: 'a', to: 'todo', index: 1 }],
  ])('records %s as one step, and undo restores the board before it', (_name, action) => {
    const changed = historyReducer(start, action)
    expect(changed.present).not.toBe(sampleBoard)
    expect(changed.past).toEqual([sampleBoard])

    const undone = historyReducer(changed, { type: 'undo' })
    expect(undone.present).toBe(sampleBoard)
    expect(undone.past).toEqual([])
  })

  it('records nothing for an action that changes nothing', () => {
    expect(historyReducer(start, { type: 'remove', id: 'missing' })).toBe(start)
  })

  it('keeps only the last ten boards', () => {
    const adds = Array.from({ length: HISTORY_LIMIT + 2 }, (_, i) => ({
      type: 'add' as const,
      item: makeItem({ id: `n${i}` }),
    }))
    const state = run(adds)
    expect(state.past).toHaveLength(HISTORY_LIMIT)
    // The two oldest boards were dropped: the earliest one left already has the first two adds.
    expect(state.past[0].columns.todo).toEqual(['n1', 'n0', 'a', 'b'])

    const undone = run(
      Array.from({ length: HISTORY_LIMIT + 2 }, () => ({ type: 'undo' as const })),
      state,
    )
    expect(undone.present.columns.todo).toEqual(['n1', 'n0', 'a', 'b'])
    expect(undone.past).toEqual([])
  })

  it('records a whole drag as one step, back to the board at pick-up', () => {
    const dropped = run([
      { type: 'dragStart' },
      { type: 'move', id: 'a', to: 'doing', index: 0 },
      { type: 'move', id: 'a', to: 'done', index: 0 },
      { type: 'move', id: 'a', to: 'done', index: 1 },
      { type: 'dragEnd' },
    ])
    expect(dropped.present.columns).toEqual({ todo: ['b'], doing: ['c'], done: ['d', 'a'] })
    expect(dropped.past).toEqual([sampleBoard])
    expect(dropped.dragStart).toBeNull()

    expect(historyReducer(dropped, { type: 'undo' }).present).toBe(sampleBoard)
  })

  it('records nothing for a drag that ends where it began', () => {
    const dropped = run([
      { type: 'dragStart' },
      { type: 'move', id: 'a', to: 'doing', index: 0 },
      { type: 'move', id: 'a', to: 'todo', index: 0 },
      { type: 'dragEnd' },
    ])
    expect(dropped).toEqual(start)
  })

  it('puts the board back and records nothing when a drag is cancelled', () => {
    const cancelled = run([
      { type: 'dragStart' },
      { type: 'move', id: 'a', to: 'done', index: 0 },
      { type: 'dragCancel' },
    ])
    expect(cancelled.present).toBe(sampleBoard)
    expect(cancelled.past).toEqual([])
    expect(cancelled.dragStart).toBeNull()
  })

  it('ignores undo when there is no history, and during a drag', () => {
    expect(historyReducer(start, { type: 'undo' })).toBe(start)

    const dragging = run([{ type: 'remove', id: 'd' }, { type: 'dragStart' }])
    expect(historyReducer(dragging, { type: 'undo' })).toBe(dragging)
  })

  it('ignores dragEnd and dragCancel when no drag is in progress', () => {
    expect(historyReducer(start, { type: 'dragEnd' })).toBe(start)
    expect(historyReducer(start, { type: 'dragCancel' })).toBe(start)
  })
})

describe('describeChange', () => {
  const after = (action: HistoryAction) => historyReducer(start, action).present

  it('names the change between two boards', () => {
    const item = makeItem({ id: 'new', title: 'Get schwifty' })
    expect(describeChange(sampleBoard, after({ type: 'add', item }))).toBe('added Get schwifty')
    expect(describeChange(sampleBoard, after({ type: 'remove', id: 'c' }))).toBe(
      'deleted Find the Council of Ricks',
    )
    expect(
      describeChange(sampleBoard, after({ type: 'move', id: 'a', to: 'done', index: 0 })),
    ).toBe('moved Build portal gun to Done')
    expect(
      describeChange(sampleBoard, after({ type: 'move', id: 'a', to: 'todo', index: 1 })),
    ).toBe('reordered Build portal gun in To Do')
  })

  it('names the card that was carried past several others', () => {
    const before = { ...sampleBoard, columns: { todo: ['a', 'b', 'c'], doing: [], done: ['d'] } }
    const moved = { ...before, columns: { ...before.columns, todo: ['c', 'a', 'b'] } }
    expect(describeChange(before, moved)).toBe('reordered Find the Council of Ricks in To Do')
  })
})

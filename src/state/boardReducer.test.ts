import { describe, expect, it } from 'vitest'
import { makeItem, sampleBoard } from '../test/fixtures'
import { boardReducer, enteredDone, findColumn } from './boardReducer'

describe('boardReducer', () => {
  it('adds new items to the top of To Do', () => {
    const item = makeItem({ id: 'new' })
    const next = boardReducer(sampleBoard, { type: 'add', item })
    expect(next.items.new).toBe(item)
    expect(next.columns.todo).toEqual(['new', 'a', 'b'])
  })

  it('removes an item from both the map and its column', () => {
    const next = boardReducer(sampleBoard, { type: 'remove', id: 'c' })
    expect(next.items.c).toBeUndefined()
    expect(next.columns.doing).toEqual([])
  })

  it('moves an item across columns at the given index', () => {
    const next = boardReducer(sampleBoard, { type: 'move', id: 'a', to: 'done', index: 0 })
    expect(next.columns.todo).toEqual(['b'])
    expect(next.columns.done).toEqual(['a', 'd'])
  })

  it('clamps out-of-range move indexes', () => {
    const next = boardReducer(sampleBoard, { type: 'move', id: 'a', to: 'doing', index: 99 })
    expect(next.columns.doing).toEqual(['c', 'a'])
  })

  it('reorders when the item is moved within its own column', () => {
    const next = boardReducer(sampleBoard, { type: 'move', id: 'a', to: 'todo', index: 1 })
    expect(next.columns.todo).toEqual(['b', 'a'])
    expect(next.columns.doing).toBe(sampleBoard.columns.doing)
  })

  it('clamps out-of-range indexes within a column', () => {
    const next = boardReducer(sampleBoard, { type: 'move', id: 'a', to: 'todo', index: 99 })
    expect(next.columns.todo).toEqual(['b', 'a'])
  })

  it('returns the same state for no-op actions', () => {
    expect(boardReducer(sampleBoard, { type: 'remove', id: 'missing' })).toBe(sampleBoard)
    expect(boardReducer(sampleBoard, { type: 'move', id: 'b', to: 'todo', index: 1 })).toBe(
      sampleBoard,
    )
  })

  it('enteredDone is true only when a card arrives in Done from another column', () => {
    expect(enteredDone('todo', 'done')).toBe(true)
    expect(enteredDone('doing', 'done')).toBe(true)
    expect(enteredDone('done', 'done')).toBe(false)
    expect(enteredDone('done', 'todo')).toBe(false)
    expect(enteredDone('todo', undefined)).toBe(false)
  })

  it('findColumn resolves both item ids and column ids', () => {
    expect(findColumn(sampleBoard, 'c')).toBe('doing')
    expect(findColumn(sampleBoard, 'done')).toBe('done')
    expect(findColumn(sampleBoard, 'nope')).toBeUndefined()
  })
})

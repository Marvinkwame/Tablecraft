import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnOrderState } from '../src/hooks/useColumnOrderState'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

describe('useColumnOrderState', () => {
  it('starts empty, meaning natural column order', () => {
    const { result } = renderHook(() => useColumnOrderState())
    expect(result.current.state).toEqual([])
    expect(result.current.order).toEqual([])
  })

  it('accepts a default order', () => {
    const { result } = renderHook(() =>
      useColumnOrderState({ defaultOrder: ['b', 'a', 'c'] })
    )
    expect(result.current.order).toEqual(['b', 'a', 'c'])
  })

  it('setOrder replaces the whole order', () => {
    const { result } = renderHook(() => useColumnOrderState({ defaultOrder: ['a', 'b'] }))
    act(() => result.current.setOrder(['b', 'a']))
    expect(result.current.order).toEqual(['b', 'a'])
  })

  it('moveColumn moves a column forward', () => {
    const { result } = renderHook(() =>
      useColumnOrderState({ defaultOrder: ['a', 'b', 'c'] })
    )
    act(() => result.current.moveColumn('a', 2))
    expect(result.current.order).toEqual(['b', 'c', 'a'])
  })

  it('moveColumn moves a column backward', () => {
    const { result } = renderHook(() =>
      useColumnOrderState({ defaultOrder: ['a', 'b', 'c'] })
    )
    act(() => result.current.moveColumn('c', 0))
    expect(result.current.order).toEqual(['c', 'a', 'b'])
  })

  it('moveColumn clamps an out-of-range index rather than dropping the column', () => {
    const { result } = renderHook(() =>
      useColumnOrderState({ defaultOrder: ['a', 'b', 'c'] })
    )
    act(() => result.current.moveColumn('a', 99))
    expect(result.current.order).toEqual(['b', 'c', 'a'])
  })

  it('moveColumn is a no-op for an id not in the order', () => {
    // An empty or partial order means "natural order" to TanStack, so there is
    // nothing to move within. Seed defaultOrder to make ordering meaningful.
    const { result } = renderHook(() =>
      useColumnOrderState({ defaultOrder: ['a', 'b'] })
    )
    act(() => result.current.moveColumn('zzz', 0))
    expect(result.current.order).toEqual(['a', 'b'])
  })

  it('resetOrder clears back to natural order', () => {
    const { result } = renderHook(() =>
      useColumnOrderState({ defaultOrder: ['b', 'a'] })
    )
    act(() => result.current.resetOrder())
    expect(result.current.order).toEqual([])
  })

  it('does not mutate the array passed as defaultOrder', () => {
    const defaultOrder = ['a', 'b', 'c']
    const { result } = renderHook(() => useColumnOrderState({ defaultOrder }))
    act(() => result.current.moveColumn('a', 2))
    expect(defaultOrder).toEqual(['a', 'b', 'c'])
  })
})

type IntRow = { id: number; name: string }
const intColumns = createColumns<IntRow>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
])
const intData: IntRow[] = [{ id: 1, name: 'Alice' }]

describe('useTable — columnOrder', () => {
  it('is absent from the return when not enabled', () => {
    const { result } = renderHook(() => useTable({ data: intData, columns: intColumns }))
    expect(result.current.columnOrder.order).toEqual([])
  })

  it('reorders the visible leaf columns when enabled', () => {
    const { result } = renderHook(() =>
      useTable({
        data: intData,
        columns: intColumns,
        columnOrder: { defaultOrder: ['name', 'id'] },
      })
    )
    expect(result.current.table.getVisibleLeafColumns().map(c => c.id)).toEqual(['name', 'id'])
  })

  it('moveColumn changes the rendered column order', () => {
    const { result } = renderHook(() =>
      useTable({
        data: intData,
        columns: intColumns,
        columnOrder: { defaultOrder: ['id', 'name'] },
      })
    )
    act(() => result.current.columnOrder.moveColumn('id', 1))
    expect(result.current.table.getVisibleLeafColumns().map(c => c.id)).toEqual(['name', 'id'])
  })
})

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

type Item = { id: number; name: string }

const columns = createColumns<Item>([
  { accessorKey: 'name', header: 'Name' },
])

describe('emptyState', () => {
  it('isEmpty is true when data is empty', () => {
    const { result } = renderHook(() =>
      useTable({ data: [] as Item[], columns })
    )

    expect(result.current.emptyState.isEmpty).toBe(true)
    expect(result.current.emptyState.isFilteredEmpty).toBe(false)
  })

  it('isEmpty is false when data has rows', () => {
    const data = [{ id: 1, name: 'Alice' }]

    const { result } = renderHook(() =>
      useTable({ data, columns, pagination: false })
    )

    expect(result.current.emptyState.isEmpty).toBe(false)
    expect(result.current.emptyState.isFilteredEmpty).toBe(false)
  })

  it('isFilteredEmpty is true when filter returns no rows', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]

    const { result } = renderHook(() =>
      useTable({ data, columns, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('zzz_nonexistent')
    })

    expect(result.current.emptyState.isEmpty).toBe(false)
    expect(result.current.emptyState.isFilteredEmpty).toBe(true)
  })

  it('isFilteredEmpty is false when filter still returns rows', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]

    const { result } = renderHook(() =>
      useTable({ data, columns, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('Alice')
    })

    expect(result.current.emptyState.isEmpty).toBe(false)
    expect(result.current.emptyState.isFilteredEmpty).toBe(false)
  })

  it('isFilteredEmpty resets when filter is cleared', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]

    const { result } = renderHook(() =>
      useTable({ data, columns, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('zzz_nonexistent')
    })

    expect(result.current.emptyState.isFilteredEmpty).toBe(true)

    act(() => {
      result.current.globalFilter.clear()
    })

    expect(result.current.emptyState.isFilteredEmpty).toBe(false)
  })

  it('isFilteredEmpty works with column filters', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]

    const { result } = renderHook(() =>
      useTable({ data, columns, pagination: false })
    )

    act(() => {
      result.current.columnFilters.setFilter('name', 'zzz_nonexistent')
    })

    expect(result.current.emptyState.isEmpty).toBe(false)
    expect(result.current.emptyState.isFilteredEmpty).toBe(true)
  })
})

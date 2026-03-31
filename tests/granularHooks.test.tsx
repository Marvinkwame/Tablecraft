import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePaginationState } from '../src/hooks/usePaginationState'
import { useSortState } from '../src/hooks/useSortState'
import { useFilterState } from '../src/hooks/useFilterState'
import { useColumnFilterState } from '../src/hooks/useColumnFilterState'

describe('usePaginationState', () => {
  it('uses default values', () => {
    const { result } = renderHook(() => usePaginationState())

    expect(result.current.state.pageIndex).toBe(0)
    expect(result.current.state.pageSize).toBe(10)
  })

  it('accepts custom defaults', () => {
    const { result } = renderHook(() =>
      usePaginationState({ pageSize: 25, pageIndex: 2 })
    )

    expect(result.current.state.pageIndex).toBe(2)
    expect(result.current.state.pageSize).toBe(25)
  })

  it('navigates forward and backward', () => {
    const { result } = renderHook(() => usePaginationState())

    act(() => result.current.nextPage())
    expect(result.current.state.pageIndex).toBe(1)

    act(() => result.current.nextPage())
    expect(result.current.state.pageIndex).toBe(2)

    act(() => result.current.previousPage())
    expect(result.current.state.pageIndex).toBe(1)
  })

  it('does not go below page 0', () => {
    const { result } = renderHook(() => usePaginationState())

    act(() => result.current.previousPage())
    expect(result.current.state.pageIndex).toBe(0)
  })

  it('resets page index when page size changes', () => {
    const { result } = renderHook(() => usePaginationState())

    act(() => result.current.nextPage())
    act(() => result.current.nextPage())
    expect(result.current.state.pageIndex).toBe(2)

    act(() => result.current.setPageSize(25))
    expect(result.current.state.pageIndex).toBe(0)
    expect(result.current.state.pageSize).toBe(25)
  })
})

describe('useSortState', () => {
  it('starts with empty sorting', () => {
    const { result } = renderHook(() => useSortState())
    expect(result.current.state).toEqual([])
  })

  it('accepts default sort', () => {
    const { result } = renderHook(() =>
      useSortState({ defaultSort: [{ id: 'name', desc: false }] })
    )

    expect(result.current.state).toEqual([{ id: 'name', desc: false }])
  })

  it('can clear sorting', () => {
    const { result } = renderHook(() =>
      useSortState({ defaultSort: [{ id: 'name', desc: false }] })
    )

    act(() => result.current.clearSorting())
    expect(result.current.state).toEqual([])
  })
})

describe('useFilterState', () => {
  it('starts with empty string', () => {
    const { result } = renderHook(() => useFilterState())
    expect(result.current.state).toBe('')
  })

  it('can set and clear value', () => {
    const { result } = renderHook(() => useFilterState())

    act(() => result.current.onGlobalFilterChange('search term'))
    expect(result.current.state).toBe('search term')

    act(() => result.current.clear())
    expect(result.current.state).toBe('')
  })
})

describe('useColumnFilterState', () => {
  it('starts with empty filters', () => {
    const { result } = renderHook(() => useColumnFilterState())
    expect(result.current.state).toEqual([])
  })

  it('can set a filter', () => {
    const { result } = renderHook(() => useColumnFilterState())

    act(() => result.current.setFilter('name', 'Alice'))
    expect(result.current.state).toEqual([{ id: 'name', value: 'Alice' }])
  })

  it('replaces filter for same column', () => {
    const { result } = renderHook(() => useColumnFilterState())

    act(() => result.current.setFilter('name', 'Alice'))
    act(() => result.current.setFilter('name', 'Bob'))

    expect(result.current.state).toEqual([{ id: 'name', value: 'Bob' }])
  })

  it('can clear a specific filter', () => {
    const { result } = renderHook(() => useColumnFilterState())

    act(() => {
      result.current.setFilter('name', 'Alice')
      result.current.setFilter('email', 'test')
    })

    act(() => result.current.clearFilter('name'))

    expect(result.current.state).toEqual([{ id: 'email', value: 'test' }])
  })

  it('can clear all filters', () => {
    const { result } = renderHook(() => useColumnFilterState())

    act(() => {
      result.current.setFilter('name', 'Alice')
      result.current.setFilter('email', 'test')
    })

    act(() => result.current.clearAll())
    expect(result.current.state).toEqual([])
  })
})

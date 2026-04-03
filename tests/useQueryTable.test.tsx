import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQueryTable } from '../src/hooks/useQueryTable'
import { createColumns } from '../src/helpers/createColumns'

type User = { id: number; name: string }

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
])

const mockUsers: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

function createMockQueryFn(data: User[] = mockUsers, rowCount?: number) {
  return vi.fn().mockResolvedValue({
    data,
    rowCount: rowCount ?? data.length,
  })
}

describe('useQueryTable', () => {
  // ─── Basic loading and data ─────────────────────────────

  it('returns loading state initially', () => {
    const queryFn = createMockQueryFn()

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.query.isLoading).toBe(true)
    expect(result.current.table.getRowModel().rows).toHaveLength(0)
  })

  it('populates table after query resolves', async () => {
    const queryFn = createMockQueryFn()

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    expect(result.current.query.data?.data).toEqual(mockUsers)
    expect(result.current.table.getRowModel().rows).toHaveLength(3)
    expect(result.current.table.getRowModel().rows[0].original.name).toBe('Alice')
  })

  // ─── Pagination ─────────────────────────────────────────

  it('passes pagination state to queryFn', async () => {
    const queryFn = createMockQueryFn(mockUsers, 100)

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
          pagination: { pageSize: 10 },
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    // First call should have pageIndex 0
    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { pageIndex: 0, pageSize: 10 },
      })
    )

    // Change page
    act(() => {
      result.current.pagination.nextPage()
    })

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: { pageIndex: 1, pageSize: 10 },
        })
      )
    })
  })

  it('computes pageCount from rowCount', async () => {
    const queryFn = createMockQueryFn(mockUsers, 50)

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
          pagination: { pageSize: 10 },
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    expect(result.current.pagination.pageCount).toBe(5)
  })

  // ─── Sorting ────────────────────────────────────────────

  it('passes sorting state to queryFn', async () => {
    const queryFn = createMockQueryFn()

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    act(() => {
      result.current.sorting.setSorting([{ id: 'name', desc: true }])
    })

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          sorting: [{ id: 'name', desc: true }],
        })
      )
    })
  })

  it('resets page index to 0 when sorting changes', async () => {
    const queryFn = createMockQueryFn(mockUsers, 100)

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
          pagination: { pageSize: 10 },
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    // Go to page 3
    act(() => {
      result.current.pagination.setPageIndex(3)
    })

    expect(result.current.pagination.pageIndex).toBe(3)

    // Change sort — should reset to page 0
    act(() => {
      result.current.sorting.setSorting([{ id: 'name', desc: true }])
    })

    expect(result.current.pagination.pageIndex).toBe(0)
  })

  // ─── Filters ────────────────────────────────────────────

  it('passes global filter to queryFn', async () => {
    const queryFn = createMockQueryFn()

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    act(() => {
      result.current.globalFilter.setValue('alice')
    })

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          globalFilter: 'alice',
        })
      )
    })
  })

  it('resets page index to 0 when filter changes', async () => {
    const queryFn = createMockQueryFn(mockUsers, 100)

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users'],
          queryFn,
          columns,
          pagination: { pageSize: 10 },
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    act(() => {
      result.current.pagination.setPageIndex(5)
    })

    act(() => {
      result.current.globalFilter.setValue('search')
    })

    expect(result.current.pagination.pageIndex).toBe(0)
  })

  // ─── Error state ────────────────────────────────────────

  it('exposes error state', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users-error'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isError).toBe(true)
    })

    expect(result.current.query.error).toBeInstanceOf(Error)
    expect(result.current.query.error?.message).toBe('Network error')
  })

  // ─── Refetch ────────────────────────────────────────────

  it('supports manual refetch', async () => {
    const queryFn = createMockQueryFn()

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users-refetch'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    const callCountBefore = queryFn.mock.calls.length

    await act(async () => {
      await result.current.query.refetch()
    })

    expect(queryFn.mock.calls.length).toBeGreaterThan(callCountBefore)
  })

  // ─── Empty state ────────────────────────────────────────

  it('emptyState is correct after data loads', async () => {
    const queryFn = createMockQueryFn([], 0)

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users-empty'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    expect(result.current.emptyState.isEmpty).toBe(true)
    expect(result.current.emptyState.isFilteredEmpty).toBe(false)
  })

  it('emptyState.isFilteredEmpty is true when filter returns no results', async () => {
    // First call returns data, second (after filter) returns empty
    const queryFn = vi.fn()
      .mockResolvedValueOnce({ data: mockUsers, rowCount: 3 })
      .mockResolvedValueOnce({ data: [], rowCount: 0 })

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users-filtered-empty'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.query.isLoading).toBe(false)
    })

    act(() => {
      result.current.globalFilter.setValue('nonexistent')
    })

    await waitFor(() => {
      expect(result.current.emptyState.isFilteredEmpty).toBe(true)
    })

    expect(result.current.emptyState.isEmpty).toBe(false)
  })

  // ─── Return shape ──────────────────────────────────────

  it('returns all expected properties', async () => {
    const queryFn = createMockQueryFn()

    const { result } = renderHook(
      () =>
        useQueryTable({
          queryKey: ['users-shape'],
          queryFn,
          columns,
        }),
      { wrapper: createWrapper() }
    )

    // Table
    expect(result.current.table).toBeDefined()
    expect(result.current.table.getRowModel).toBeDefined()

    // Pagination
    expect(result.current.pagination).toBeDefined()
    expect(result.current.pagination.nextPage).toBeTypeOf('function')
    expect(result.current.pagination.previousPage).toBeTypeOf('function')

    // Sorting
    expect(result.current.sorting).toBeDefined()
    expect(result.current.sorting.setSorting).toBeTypeOf('function')
    expect(result.current.sorting.clearSorting).toBeTypeOf('function')

    // Filters
    expect(result.current.globalFilter).toBeDefined()
    expect(result.current.columnFilters).toBeDefined()

    // Empty state
    expect(result.current.emptyState).toBeDefined()

    // Query
    expect(result.current.query).toBeDefined()
    expect(result.current.query.refetch).toBeTypeOf('function')
    expect(result.current.query).toHaveProperty('isLoading')
    expect(result.current.query).toHaveProperty('isError')
    expect(result.current.query).toHaveProperty('isFetching')
    expect(result.current.query).toHaveProperty('isPlaceholderData')
    expect(result.current.query).toHaveProperty('status')
    expect(result.current.query).toHaveProperty('fetchStatus')
  })
})

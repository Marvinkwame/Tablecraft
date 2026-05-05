import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useInfiniteTable } from '../src/hooks/useInfiniteTable'
import { createColumns } from '../src/helpers/createColumns'
import type { InfiniteTableResult } from '../src'

// ─── Test data ────────────────────────────────────────────

type User = { id: number; name: string }

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
])

const page1: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

const page2: User[] = [
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'Dave' },
]

// ─── Wrapper factory ──────────────────────────────────────

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

// ─── QueryFn helpers ──────────────────────────────────────

function createPaginatedQueryFn(
  pages: User[][],
  cursors: (unknown | undefined)[]
) {
  return vi.fn().mockImplementation(({ pageParam }: { pageParam: unknown }) => {
    const index = typeof pageParam === 'number' ? pageParam : 0
    return Promise.resolve<InfiniteTableResult<User>>({
      data: pages[index] ?? [],
      nextCursor: cursors[index],
    })
  })
}

// ─── Tests ───────────────────────────────────────────────

describe('useInfiniteTable', () => {

  // ─── Loading state ──────────────────────────────────────

  it('isLoading is true on first render before queryFn resolves', () => {
    const queryFn = vi.fn().mockImplementation(
      () => new Promise(() => {/* never resolves */})
    )

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-loading'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.table.getRowModel().rows).toHaveLength(0)
  })

  // ─── Data population ────────────────────────────────────

  it('populates table rows after queryFn resolves', async () => {
    const queryFn = createPaginatedQueryFn([page1], [undefined])

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-data'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.table.getRowModel().rows).toHaveLength(2)
    expect(result.current.table.getRowModel().rows[0].original.name).toBe('Alice')
  })

  // ─── hasNextPage ────────────────────────────────────────

  it('hasNextPage is true when queryFn returns a nextCursor', async () => {
    const queryFn = createPaginatedQueryFn([page1], [1])

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-has-next'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.hasNextPage).toBe(true)
  })

  it('hasNextPage is false when queryFn returns no nextCursor', async () => {
    const queryFn = createPaginatedQueryFn([page1], [undefined])

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-no-next'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.hasNextPage).toBe(false)
  })

  // ─── loadMore ───────────────────────────────────────────

  it('loadMore accumulates rows from both pages', async () => {
    const queryFn = createPaginatedQueryFn([page1, page2], [1, undefined])

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-load-more'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.table.getRowModel().rows).toHaveLength(2)

    act(() => result.current.loadMore())

    await waitFor(() =>
      expect(result.current.table.getRowModel().rows).toHaveLength(4)
    )

    const names = result.current.table.getRowModel().rows.map((r) => r.original.name)
    expect(names).toEqual(['Alice', 'Bob', 'Charlie', 'Dave'])
  })

  // ─── isFetchingNextPage ─────────────────────────────────

  it('isFetchingNextPage is true while loadMore is in-flight', async () => {
    let resolveNextPage!: () => void
    const queryFn = vi.fn().mockImplementation(({ pageParam }: { pageParam: unknown }) => {
      if (pageParam === 0) {
        return Promise.resolve<InfiniteTableResult<User>>({ data: page1, nextCursor: 1 })
      }
      return new Promise<InfiniteTableResult<User>>((resolve) => {
        resolveNextPage = () => resolve({ data: page2, nextCursor: undefined })
      })
    })

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-fetching-next'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.loadMore())

    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(true))

    resolveNextPage()

    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false))
    expect(result.current.table.getRowModel().rows).toHaveLength(4)
  })

  // ─── Sorting state passthrough ───────────────────────────

  it('passes sorting state to queryFn', async () => {
    const queryFn = createPaginatedQueryFn([page1], [undefined])

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-sort'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

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

  // ─── Global filter passthrough ───────────────────────────

  it('passes globalFilter to queryFn', async () => {
    const queryFn = createPaginatedQueryFn([page1], [undefined])

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-filter'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.globalFilter.setValue('alice')
    })

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({ globalFilter: 'alice' })
      )
    })
  })

  // ─── Sort change resets pages ────────────────────────────

  it('sort change resets accumulated pages back to page 1', async () => {
    // page at cursor 0 (initial), page at cursor 0 again after sort reset
    const queryFn = vi.fn().mockImplementation(
      ({ pageParam }: { pageParam: unknown }) => {
        if (pageParam === 0) {
          return Promise.resolve<InfiniteTableResult<User>>({
            data: page1,
            nextCursor: 1,
          })
        }
        return Promise.resolve<InfiniteTableResult<User>>({
          data: page2,
          nextCursor: undefined,
        })
      }
    )

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-reset'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    // Wait for initial load (2 rows)
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Load next page → now 4 rows
    act(() => result.current.loadMore())
    await waitFor(() =>
      expect(result.current.table.getRowModel().rows).toHaveLength(4)
    )

    // Change sort — queryKey changes, infinite query resets to initialPageParam
    act(() => {
      result.current.sorting.setSorting([{ id: 'name', desc: false }])
    })

    // Should drop back to 2 rows (only page 1 from the new query key)
    await waitFor(() =>
      expect(result.current.table.getRowModel().rows).toHaveLength(2)
    )
  })

  // ─── Error state ────────────────────────────────────────

  it('isError is true when queryFn throws', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(
      () => useInfiniteTable({ queryKey: ['users-error'], queryFn, columns }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Fetch failed')
    expect(result.current.isLoading).toBe(false)
  })
})

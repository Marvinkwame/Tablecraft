import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTable } from '../src/hooks/useTable'
import { useQueryTable } from '../src/hooks/useQueryTable'
import { useInfiniteTable } from '../src/hooks/useInfiniteTable'
import { useVirtualRows } from '../src/hooks/useVirtualRows'
import { createColumns } from '../src/helpers/createColumns'

// ─── Mock @tanstack/react-virtual ─────────────────────────
// jsdom does not support scroll layout — mock useVirtualizer to return
// a predictable slice of the first 5 rows regardless of scroll position.

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(),
}))

const mockUseVirtualizer = vi.mocked(useVirtualizer)
const ROW_HEIGHT = 48

/**
 * Configure the mock to return a predictable slice of up to 5 virtual items.
 * Returns the inner scrollToIndex spy so tests can assert on it.
 */
function setupVirtualizerMock(count: number) {
  const mockScrollToIndex = vi.fn()
  mockUseVirtualizer.mockReturnValue({
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 5) }, (_, i) => ({
        index: i,
        start: i * ROW_HEIGHT,
        size: ROW_HEIGHT,
        key: i,
      })),
    getTotalSize: () => count * ROW_HEIGHT,
    scrollToIndex: mockScrollToIndex,
  } as unknown as ReturnType<typeof useVirtualizer>)
  return { mockScrollToIndex }
}

// ─── Test data ────────────────────────────────────────────

type User = { id: number; name: string }

const users: User[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
])

// ─── Helpers ─────────────────────────────────────────────

function renderVirtualHook(data: User[] = users) {
  return renderHook(() => {
    const { table } = useTable({ data, columns })
    return useVirtualRows(table, { rowHeight: ROW_HEIGHT })
  })
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

// ─── Tests ───────────────────────────────────────────────

describe('useVirtualRows — virtualRows subset', () => {
  it('returns fewer rows than the total dataset (only visible rows rendered)', () => {
    setupVirtualizerMock(users.length)
    const { result } = renderVirtualHook()

    expect(result.current.virtualRows.length).toBeLessThan(users.length)
    expect(result.current.virtualRows.length).toBeGreaterThan(0)
  })
})

describe('useVirtualRows — VirtualRow shape', () => {
  it('each virtualRow has correct row, index, start, and size', () => {
    setupVirtualizerMock(users.length)
    const { result } = renderVirtualHook()
    const first = result.current.virtualRows[0]

    expect(first.index).toBe(0)
    expect(first.start).toBe(0)
    expect(first.size).toBe(ROW_HEIGHT)
    expect(first.row.original).toEqual(users[0])

    const second = result.current.virtualRows[1]
    expect(second.index).toBe(1)
    expect(second.start).toBe(ROW_HEIGHT)
    expect(second.row.original).toEqual(users[1])
  })
})

describe('useVirtualRows — totalHeight', () => {
  it('equals rowCount × rowHeight', () => {
    setupVirtualizerMock(users.length)
    const { result } = renderVirtualHook()

    expect(result.current.totalHeight).toBe(users.length * ROW_HEIGHT)
  })
})

describe('useVirtualRows — containerRef', () => {
  it('is a React ref object with a current property', () => {
    setupVirtualizerMock(users.length)
    const { result } = renderVirtualHook()

    expect(result.current.containerRef).toHaveProperty('current')
  })
})

describe('useVirtualRows — scrollToIndex', () => {
  it('is a callable function that delegates to the virtualizer', () => {
    const { mockScrollToIndex } = setupVirtualizerMock(users.length)
    const { result } = renderVirtualHook()

    expect(typeof result.current.scrollToIndex).toBe('function')
    act(() => result.current.scrollToIndex(5))
    expect(mockScrollToIndex).toHaveBeenCalledWith(5)
  })
})

describe('useVirtualRows — scrollToIndex stability', () => {
  it('scrollToIndex is the same function reference across re-renders when data is unchanged', () => {
    setupVirtualizerMock(users.length)
    const { result, rerender } = renderHook(() => {
      const { table } = useTable({ data: users, columns })
      return useVirtualRows(table, { rowHeight: ROW_HEIGHT })
    })

    const first = result.current.scrollToIndex
    rerender()
    expect(result.current.scrollToIndex).toBe(first)
  })
})

describe('useVirtualRows — empty data', () => {
  it('virtualRows is [] and totalHeight is 0 when data is empty', () => {
    setupVirtualizerMock(0)
    const { result } = renderVirtualHook([])

    expect(result.current.virtualRows).toEqual([])
    expect(result.current.totalHeight).toBe(0)
  })
})

describe('useVirtualRows — data changes', () => {
  it('virtualRows updates when data changes — new rows reflected in mapping', () => {
    setupVirtualizerMock(users.length)
    const { result, rerender } = renderHook(
      ({ data }: { data: User[] }) => {
        const { table } = useTable({ data, columns })
        return useVirtualRows(table, { rowHeight: ROW_HEIGHT })
      },
      { initialProps: { data: users } }
    )

    expect(result.current.virtualRows[0].row.original.name).toBe('User 0')

    const updatedUsers = users.map((u) => ({ ...u, name: `Updated ${u.id}` }))
    setupVirtualizerMock(updatedUsers.length)
    rerender({ data: updatedUsers })

    expect(result.current.virtualRows[0].row.original.name).toBe('Updated 0')
  })
})

describe('useVirtualRows — useTable integration', () => {
  it('virtual items map to the correct TanStack row objects from useTable', () => {
    setupVirtualizerMock(users.length)
    const { result } = renderVirtualHook()

    result.current.virtualRows.forEach(({ row, index }) => {
      expect(row.original).toEqual(users[index])
    })
  })
})

describe('useVirtualRows — useQueryTable smoke test', () => {
  it('works with a useQueryTable-backed table without errors', async () => {
    setupVirtualizerMock(3)
    const queryFn = vi.fn().mockResolvedValue({
      data: users.slice(0, 3),
      rowCount: 3,
    })

    const { result } = renderHook(
      () => {
        const { table } = useQueryTable({
          queryKey: ['virtual-query-test'],
          queryFn,
          columns,
        })
        return useVirtualRows(table, { rowHeight: ROW_HEIGHT })
      },
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.containerRef).toHaveProperty('current')
      expect(typeof result.current.scrollToIndex).toBe('function')
      expect(result.current.virtualRows.length).toBeGreaterThan(0)
      expect(result.current.totalHeight).toBe(3 * ROW_HEIGHT)
    })
  })
})

describe('useVirtualRows — useInfiniteTable smoke test', () => {
  it('works with a useInfiniteTable-backed table without errors', async () => {
    setupVirtualizerMock(2)
    const queryFn = vi.fn().mockResolvedValue({
      data: users.slice(0, 2),
      nextCursor: undefined,
    })

    const { result } = renderHook(
      () => {
        const { table } = useInfiniteTable({
          queryKey: ['virtual-infinite-test'],
          queryFn,
          columns,
        })
        return useVirtualRows(table, { rowHeight: ROW_HEIGHT })
      },
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.containerRef).toHaveProperty('current')
      expect(typeof result.current.scrollToIndex).toBe('function')
      expect(result.current.virtualRows.length).toBeGreaterThan(0)
      expect(result.current.totalHeight).toBe(2 * ROW_HEIGHT)
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

type User = { id: number; name: string; age: number }

const testData: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: 20 + i,
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
])

// ─── Helpers ──────────────────────────────────────────────

function setURL(search: string) {
  Object.defineProperty(window, 'location', {
    value: { search, pathname: '/users' },
    writable: true,
    configurable: true,
  })
}

let replaceStateSpy: ReturnType<typeof vi.fn>
let pushStateSpy: ReturnType<typeof vi.fn>

function setupHistorySpies() {
  replaceStateSpy = vi.fn()
  pushStateSpy = vi.fn()
  Object.defineProperty(window, 'history', {
    value: { replaceState: replaceStateSpy, pushState: pushStateSpy },
    writable: true,
    configurable: true,
  })
}

describe('useTable URL sync', () => {
  beforeEach(() => {
    setURL('')
    setupHistorySpies()
  })

  // ─── Initialization from URL ────────────────────────────

  it('initializes pagination from URL params', () => {
    setURL('?page=3&pageSize=5')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: true })
    )

    expect(result.current.pagination.pageIndex).toBe(2) // 1-based → 0-based
    expect(result.current.pagination.pageSize).toBe(5)
  })

  it('initializes sorting from URL params', () => {
    setURL('?sort=name_desc')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: true })
    )

    expect(result.current.sorting.sortingState).toEqual([
      { id: 'name', desc: true },
    ])
  })

  it('initializes global filter from URL params', () => {
    setURL('?filter=User%201')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: true })
    )

    expect(result.current.globalFilter.value).toBe('User 1')
  })

  it('initializes column filters from URL params', () => {
    setURL('?filter_age=25')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: true })
    )

    expect(result.current.columnFilters.state).toEqual([
      { id: 'age', value: '25' },
    ])
  })

  // ─── State changes write to URL ─────────────────────────

  it('writes pagination changes to URL via replaceState', () => {
    setURL('')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: true })
    )

    act(() => {
      result.current.pagination.nextPage()
    })

    // Check that replaceState was called with page=2
    const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1]
    const url = lastCall[2] as string
    expect(url).toContain('page=2')
  })

  it('writes sorting changes to URL', () => {
    setURL('')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: true })
    )

    act(() => {
      result.current.sorting.setSorting([{ id: 'name', desc: true }])
    })

    const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1]
    const url = lastCall[2] as string
    expect(url).toContain('sort=name_desc')
  })

  it('writes global filter changes to URL', () => {
    setURL('')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: true })
    )

    act(() => {
      result.current.globalFilter.setValue('hello')
    })

    const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1]
    const url = lastCall[2] as string
    expect(url).toContain('filter=hello')
  })

  // ─── Custom keys ────────────────────────────────────────

  it('uses custom URL key mapping', () => {
    setURL('?p=2&q=test')

    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        syncUrl: {
          keys: { page: 'p', filter: 'q' },
        },
      })
    )

    expect(result.current.pagination.pageIndex).toBe(1)
    expect(result.current.globalFilter.value).toBe('test')
  })

  // ─── Push mode ──────────────────────────────────────────

  it('uses pushState when mode is push', () => {
    setURL('')

    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        syncUrl: { mode: 'push' },
      })
    )

    act(() => {
      result.current.pagination.nextPage()
    })

    expect(pushStateSpy.mock.calls.length).toBeGreaterThan(0)
  })

  // ─── No sync when disabled ──────────────────────────────

  it('does not write to URL when syncUrl is false', () => {
    setURL('')

    const { result } = renderHook(() =>
      useTable({ data: testData, columns, syncUrl: false })
    )

    act(() => {
      result.current.pagination.nextPage()
    })

    // replaceState should not have been called (or only called 0 times for URL sync)
    // Since other things might call it, we just check it wasn't called with table params
    const urlCalls = replaceStateSpy.mock.calls.filter((call: unknown[]) => {
      const url = call[2] as string
      return url && url.includes('page=')
    })
    expect(urlCalls).toHaveLength(0)
  })

  // ─── URL priority over persist ──────────────────────────

  it('URL params override persisted state', () => {
    // Set persisted state
    localStorage.setItem(
      'tablecraft:url-test',
      JSON.stringify({ sorting: [{ id: 'age', desc: true }] })
    )

    // Set URL with different sorting
    setURL('?sort=name_asc')

    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        persist: 'localStorage',
        persistKey: 'url-test',
        syncUrl: true,
      })
    )

    // URL should win
    expect(result.current.sorting.sortingState).toEqual([
      { id: 'name', desc: false },
    ])

    // Clean up
    localStorage.removeItem('tablecraft:url-test')
  })
})

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

type User = { id: number; name: string; email: string; age: number }

const testData: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `User ${String.fromCharCode(90 - i)}`,
  email: `user${i + 1}@test.com`,
  age: 20 + i,
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'age', header: 'Age' },
])

describe('useTable', () => {
  // ─── Basic ────────────────────────────────────────────────

  it('returns a table instance', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    expect(result.current.table).toBeDefined()
    expect(result.current.table.getRowModel).toBeDefined()
  })

  it('returns pagination, sorting, globalFilter, columnFilters', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    expect(result.current.pagination).toBeDefined()
    expect(result.current.sorting).toBeDefined()
    expect(result.current.globalFilter).toBeDefined()
    expect(result.current.columnFilters).toBeDefined()
  })

  // ─── Pagination ───────────────────────────────────────────

  it('paginates with default page size of 10', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    expect(result.current.pagination.pageSize).toBe(10)
    expect(result.current.pagination.pageIndex).toBe(0)
    expect(result.current.table.getRowModel().rows).toHaveLength(10)
  })

  it('respects custom page size', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: { pageSize: 5 } })
    )

    expect(result.current.pagination.pageSize).toBe(5)
    expect(result.current.table.getRowModel().rows).toHaveLength(5)
  })

  it('navigates pages', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: { pageSize: 10 } })
    )

    expect(result.current.pagination.canNextPage).toBe(true)
    expect(result.current.pagination.canPreviousPage).toBe(false)

    act(() => {
      result.current.pagination.nextPage()
    })

    expect(result.current.pagination.pageIndex).toBe(1)
    expect(result.current.pagination.canPreviousPage).toBe(true)

    act(() => {
      result.current.pagination.previousPage()
    })

    expect(result.current.pagination.pageIndex).toBe(0)
  })

  it('computes pageCount correctly', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: { pageSize: 10 } })
    )

    // 25 items / 10 per page = 3 pages
    expect(result.current.pagination.pageCount).toBe(3)
  })

  it('can set page index directly', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: { pageSize: 10 } })
    )

    act(() => {
      result.current.pagination.setPageIndex(2)
    })

    expect(result.current.pagination.pageIndex).toBe(2)
  })

  it('can change page size', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: { pageSize: 10 } })
    )

    act(() => {
      result.current.pagination.setPageSize(25)
    })

    expect(result.current.pagination.pageSize).toBe(25)
    expect(result.current.table.getRowModel().rows).toHaveLength(25)
  })

  it('disables pagination when set to false', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: false })
    )

    expect(result.current.table.getRowModel().rows).toHaveLength(25)
  })

  // ─── Sorting ──────────────────────────────────────────────

  it('starts with empty sorting by default', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    expect(result.current.sorting.sortingState).toEqual([])
  })

  it('supports default sort', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        sorting: { defaultSort: [{ id: 'name', desc: false }] },
      })
    )

    expect(result.current.sorting.sortingState).toEqual([
      { id: 'name', desc: false },
    ])
  })

  it('can set sorting programmatically', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    act(() => {
      result.current.sorting.setSorting([{ id: 'age', desc: true }])
    })

    expect(result.current.sorting.sortingState).toEqual([
      { id: 'age', desc: true },
    ])

    // First row should be highest age
    const firstRow = result.current.table.getRowModel().rows[0]
    expect(firstRow.original.age).toBe(44)
  })

  it('can clear sorting', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        sorting: { defaultSort: [{ id: 'name', desc: false }] },
      })
    )

    act(() => {
      result.current.sorting.clearSorting()
    })

    expect(result.current.sorting.sortingState).toEqual([])
  })

  // ─── Global Filter ────────────────────────────────────────

  it('starts with empty global filter', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    expect(result.current.globalFilter.value).toBe('')
  })

  it('can set global filter value', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('User Z')
    })

    expect(result.current.globalFilter.value).toBe('User Z')
    // Should filter rows
    expect(result.current.table.getRowModel().rows.length).toBeLessThan(25)
  })

  it('can clear global filter', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('User Z')
    })

    act(() => {
      result.current.globalFilter.clear()
    })

    expect(result.current.globalFilter.value).toBe('')
    expect(result.current.table.getRowModel().rows).toHaveLength(25)
  })

  // ─── Column Filters ───────────────────────────────────────

  it('starts with empty column filters', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    expect(result.current.columnFilters.state).toEqual([])
  })

  it('can set a column filter', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: false })
    )

    act(() => {
      result.current.columnFilters.setFilter('name', 'User Z')
    })

    expect(result.current.columnFilters.state).toEqual([
      { id: 'name', value: 'User Z' },
    ])
  })

  it('can clear a specific column filter', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: false })
    )

    act(() => {
      result.current.columnFilters.setFilter('name', 'User Z')
      result.current.columnFilters.setFilter('email', 'test')
    })

    act(() => {
      result.current.columnFilters.clearFilter('name')
    })

    expect(result.current.columnFilters.state).toEqual([
      { id: 'email', value: 'test' },
    ])
  })

  it('can clear all column filters', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, pagination: false })
    )

    act(() => {
      result.current.columnFilters.setFilter('name', 'User Z')
      result.current.columnFilters.setFilter('email', 'test')
    })

    act(() => {
      result.current.columnFilters.clearAll()
    })

    expect(result.current.columnFilters.state).toEqual([])
  })

  // ─── Escape hatch ─────────────────────────────────────────

  it('exposes the full TanStack table instance', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    const { table } = result.current
    expect(table.getHeaderGroups).toBeDefined()
    expect(table.getRowModel).toBeDefined()
    expect(table.getCanNextPage).toBeDefined()
    expect(table.getAllColumns).toBeDefined()
  })
})

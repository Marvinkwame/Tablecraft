import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useServerTable } from '../src/hooks/useServerTable'
import { createColumns } from '../src/helpers/createColumns'

type User = { id: number; name: string }

const testData: User[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
]

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
])

describe('useServerTable', () => {
  it('returns a table instance with server-side defaults', () => {
    const { result } = renderHook(() =>
      useServerTable({
        data: testData,
        columns,
        rowCount: 100,
      })
    )

    expect(result.current.table).toBeDefined()
    expect(result.current.pagination).toBeDefined()
    expect(result.current.sorting).toBeDefined()
  })

  it('computes page count from rowCount', () => {
    const { result } = renderHook(() =>
      useServerTable({
        data: testData,
        columns,
        rowCount: 100,
        pagination: { pageSize: 10 },
      })
    )

    expect(result.current.pagination.pageCount).toBe(10)
  })

  it('does not client-side sort the data', () => {
    const { result } = renderHook(() =>
      useServerTable({
        data: testData,
        columns,
        rowCount: 3,
      })
    )

    // Set sorting — data order should NOT change (server handles it)
    act(() => {
      result.current.sorting.setSorting([{ id: 'name', desc: true }])
    })

    const rows = result.current.table.getRowModel().rows
    expect(rows[0].original.name).toBe('Alice') // unchanged order
  })

  it('calls external onPaginationChange', () => {
    const onPaginationChange = vi.fn()

    const { result } = renderHook(() =>
      useServerTable({
        data: testData,
        columns,
        rowCount: 100,
        onPaginationChange,
      })
    )

    act(() => {
      result.current.table.setPagination({ pageIndex: 2, pageSize: 10 })
    })

    expect(onPaginationChange).toHaveBeenCalled()
  })

  it('calls external onSortingChange', () => {
    const onSortingChange = vi.fn()

    const { result } = renderHook(() =>
      useServerTable({
        data: testData,
        columns,
        rowCount: 100,
        onSortingChange,
      })
    )

    act(() => {
      result.current.table.setSorting([{ id: 'name', desc: true }])
    })

    expect(onSortingChange).toHaveBeenCalled()
  })
})

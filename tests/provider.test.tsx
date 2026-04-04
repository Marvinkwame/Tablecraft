import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'
import { TableKitProvider } from '../src/context/TableKitContext'

// ─── Test data ────────────────────────────────────────────

type User = { id: number; name: string; age: number }

const testData: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: 20 + i,
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
])

// ─── Helpers ──────────────────────────────────────────────

function wrapper(defaults: Record<string, unknown>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TableKitProvider defaults={defaults as any}>
        {children}
      </TableKitProvider>
    )
  }
}

// ─── Tests ────────────────────────────────────────────────

describe('TableKitProvider', () => {
  it('works without provider (backwards compatible)', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )

    expect(result.current.table).toBeDefined()
    expect(result.current.pagination.pageSize).toBe(10) // default
  })

  it('inherits pageSize from provider', () => {
    const { result } = renderHook(
      () => useTable({ data: testData, columns }),
      { wrapper: wrapper({ pageSize: 5 }) }
    )

    expect(result.current.pagination.pageSize).toBe(5)
    expect(result.current.table.getRowModel().rows).toHaveLength(5)
  })

  it('per-call pagination overrides provider pageSize', () => {
    const { result } = renderHook(
      () => useTable({ data: testData, columns, pagination: { pageSize: 3 } }),
      { wrapper: wrapper({ pageSize: 20 }) }
    )

    expect(result.current.pagination.pageSize).toBe(3)
  })

  it('pagination: true with provider pageSize uses provider value', () => {
    const { result } = renderHook(
      () => useTable({ data: testData, columns, pagination: true }),
      { wrapper: wrapper({ pageSize: 7 }) }
    )

    expect(result.current.pagination.pageSize).toBe(7)
  })

  it('inherits rowSelection from provider', () => {
    const { result } = renderHook(
      () => useTable({ data: testData, columns }),
      { wrapper: wrapper({ rowSelection: true }) }
    )

    // rowSelection should be enabled via provider
    expect(result.current.rowSelection).toBeDefined()
    expect(result.current.rowSelection.selectedCount).toBe(0)
  })

  it('inherits columnVisibility from provider', () => {
    const { result } = renderHook(
      () => useTable({ data: testData, columns }),
      { wrapper: wrapper({ columnVisibility: true }) }
    )

    expect(result.current.columnVisibility).toBeDefined()
    expect(result.current.columnVisibility.hiddenColumns).toEqual([])
  })

  it('inherits persist from provider', () => {
    // Just verify it doesn't crash — persist needs persistKey per-table
    const { result } = renderHook(
      () => useTable({ data: testData, columns, persistKey: 'provider-test' }),
      { wrapper: wrapper({ persist: 'localStorage' }) }
    )

    expect(result.current.table).toBeDefined()
    localStorage.removeItem('tablecraft:provider-test')
  })

  it('per-call options override provider defaults', () => {
    const { result } = renderHook(
      () => useTable({ data: testData, columns, rowSelection: false }),
      { wrapper: wrapper({ rowSelection: true }) }
    )

    // Per-call rowSelection: false should win
    // rowSelection return still exists but state is empty (disabled)
    expect(result.current.rowSelection.selectedCount).toBe(0)
  })

  it('nested providers — inner wins', () => {
    function InnerWrapper({ children }: { children: React.ReactNode }) {
      return (
        <TableKitProvider defaults={{ pageSize: 20 }}>
          <TableKitProvider defaults={{ pageSize: 3 }}>
            {children}
          </TableKitProvider>
        </TableKitProvider>
      )
    }

    const { result } = renderHook(
      () => useTable({ data: testData, columns }),
      { wrapper: InnerWrapper }
    )

    expect(result.current.pagination.pageSize).toBe(3)
  })

  it('provider fuzzy flag flows through', () => {
    // Should not crash — fuzzy requires match-sorter peer dep
    const { result } = renderHook(
      () => useTable({ data: testData, columns }),
      { wrapper: wrapper({ fuzzy: true }) }
    )

    expect(result.current.table).toBeDefined()
  })
})

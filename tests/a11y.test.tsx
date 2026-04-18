import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'
import { useTableA11y } from '../src/hooks/useTableA11y'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

// ─── Test data ────────────────────────────────────────────

type User = { id: number; name: string; role: string }

const users: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  role: i % 2 === 0 ? 'Admin' : 'Member',
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
])

// Helper: render useTable + useTableA11y together
function renderA11yHook(options: Parameters<typeof useTable<User>>[0] = { data: users, columns }) {
  return renderHook(() => {
    const tableReturn = useTable(options)
    const a11y = useTableA11y(tableReturn.table)
    return { ...tableReturn, a11y }
  })
}

// ─── getTableProps ────────────────────────────────────────

describe('useTableA11y — getTableProps', () => {
  it('returns role="grid"', () => {
    const { result } = renderA11yHook()
    expect(result.current.a11y.getTableProps().role).toBe('grid')
  })

  it('returns correct aria-rowcount', () => {
    const { result } = renderA11yHook()
    expect(result.current.a11y.getTableProps()['aria-rowcount']).toBe(5)
  })

  it('returns correct aria-colcount for visible columns', () => {
    const { result } = renderA11yHook()
    // 2 columns defined
    expect(result.current.a11y.getTableProps()['aria-colcount']).toBe(2)
  })
})

// ─── getHeaderProps ───────────────────────────────────────

describe('useTableA11y — getHeaderProps', () => {
  it('returns role="columnheader"', () => {
    const { result } = renderA11yHook()
    const headers = result.current.table.getFlatHeaders()
    expect(result.current.a11y.getHeaderProps(headers[0].id).role).toBe('columnheader')
  })

  it('returns aria-sort="none" when column is not sorted', () => {
    const { result } = renderA11yHook()
    const headers = result.current.table.getFlatHeaders()
    expect(result.current.a11y.getHeaderProps(headers[0].id)['aria-sort']).toBe('none')
  })

  it('returns aria-sort="ascending" after ascending sort is applied', () => {
    const { result } = renderA11yHook()
    const headers = result.current.table.getFlatHeaders()
    const nameHeader = headers.find((h) => h.id === 'name')!

    act(() => result.current.sorting.setSorting([{ id: 'name', desc: false }]))

    expect(result.current.a11y.getHeaderProps(nameHeader.id)['aria-sort']).toBe('ascending')
  })

  it('returns aria-sort="descending" after descending sort is applied', () => {
    const { result } = renderA11yHook()
    const headers = result.current.table.getFlatHeaders()
    const nameHeader = headers.find((h) => h.id === 'name')!

    act(() => result.current.sorting.setSorting([{ id: 'name', desc: true }]))

    expect(result.current.a11y.getHeaderProps(nameHeader.id)['aria-sort']).toBe('descending')
  })
})

// ─── getRowProps ──────────────────────────────────────────

describe('useTableA11y — getRowProps', () => {
  it('returns role="row"', () => {
    const { result } = renderA11yHook()
    const row = result.current.table.getRowModel().rows[0]
    expect(result.current.a11y.getRowProps(row.id).role).toBe('row')
  })

  it('returns 1-based aria-rowindex', () => {
    const { result } = renderA11yHook()
    const rows = result.current.table.getRowModel().rows
    expect(result.current.a11y.getRowProps(rows[0].id)['aria-rowindex']).toBe(1)
    expect(result.current.a11y.getRowProps(rows[2].id)['aria-rowindex']).toBe(3)
    expect(result.current.a11y.getRowProps(rows[4].id)['aria-rowindex']).toBe(5)
  })

  it('includes aria-selected when selectionEnabled: true is passed', () => {
    const { result } = renderHook(() => {
      const tableReturn = useTable({ data: users, columns, rowSelection: true })
      const a11y = useTableA11y(tableReturn.table, { selectionEnabled: true })
      return { ...tableReturn, a11y }
    })
    const row = result.current.table.getRowModel().rows[0]
    const props = result.current.a11y.getRowProps(row.id)
    expect('aria-selected' in props).toBe(true)
    expect(props['aria-selected']).toBe(false)
  })

  it('omits aria-selected when selectionEnabled is not set', () => {
    const { result } = renderA11yHook()
    const row = result.current.table.getRowModel().rows[0]
    const props = result.current.a11y.getRowProps(row.id)
    expect('aria-selected' in props).toBe(false)
  })

  it('includes aria-expanded on expandable rows', () => {
    type TreeNode = { id: number; name: string; subRows?: TreeNode[] }
    const nested: TreeNode[] = [
      { id: 0, name: 'Parent', subRows: [{ id: 1, name: 'Child' }] },
    ]
    const nestedColumns = createColumns<TreeNode>([
      { accessorKey: 'name', header: 'Name' },
    ])

    const { result } = renderHook(() => {
      const tableReturn = useTable({
        data: nested,
        columns: nestedColumns,
        rowExpansion: { getSubRows: (row: TreeNode) => row.subRows },
      })
      return { ...tableReturn, a11y: useTableA11y(tableReturn.table) }
    })

    const rows = result.current.table.getCoreRowModel().rows
    const parentRow = rows[0]
    const props = result.current.a11y.getRowProps(parentRow.id)
    expect('aria-expanded' in props).toBe(true)
  })
})

// ─── Keyboard navigation ──────────────────────────────────

describe('useTableA11y — keyboard navigation', () => {
  it('ArrowDown increments focusedRowIndex and gives tabIndex=0 to that row', () => {
    const { result } = renderA11yHook()
    const rows = result.current.table.getRowModel().rows

    // Initially row 0 has tabIndex 0
    expect(result.current.a11y.getRowProps(rows[0].id).tabIndex).toBe(0)
    expect(result.current.a11y.getRowProps(rows[1].id).tabIndex).toBe(-1)

    // Fire ArrowDown on row 0
    act(() => {
      result.current.a11y.getRowProps(rows[0].id).onKeyDown({
        key: 'ArrowDown',
        preventDefault: () => {},
      } as React.KeyboardEvent)
    })

    expect(result.current.a11y.focusedRowIndex).toBe(1)
    expect(result.current.a11y.getRowProps(rows[1].id).tabIndex).toBe(0)
    expect(result.current.a11y.getRowProps(rows[0].id).tabIndex).toBe(-1)
  })

  it('ArrowUp decrements focusedRowIndex and clamps at 0', () => {
    const { result } = renderA11yHook()
    const rows = result.current.table.getRowModel().rows

    // ArrowUp from default (row 0) should stay at 0
    act(() => {
      result.current.a11y.getRowProps(rows[0].id).onKeyDown({
        key: 'ArrowUp',
        preventDefault: () => {},
      } as React.KeyboardEvent)
    })

    expect(result.current.a11y.focusedRowIndex).toBe(0)
  })
})

// ─── getCellProps ─────────────────────────────────────────

describe('useTableA11y — getCellProps', () => {
  it('returns role="gridcell" and 1-based aria-colindex', () => {
    const { result } = renderA11yHook()

    const col0 = result.current.a11y.getCellProps(0)
    expect(col0.role).toBe('gridcell')
    expect(col0['aria-colindex']).toBe(1)

    const col1 = result.current.a11y.getCellProps(1)
    expect(col1['aria-colindex']).toBe(2)
  })
})

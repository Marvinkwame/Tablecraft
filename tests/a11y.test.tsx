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

// ─── aria-rowindex across pagination and sorting ──────────

describe('useTableA11y — aria-rowindex reflects position in the full row set', () => {
  function renderPaged() {
    return renderHook(() => {
      const tableReturn = useTable({ data: users, columns, pagination: { pageSize: 2 } })
      return { ...tableReturn, a11y: useTableA11y(tableReturn.table) }
    })
  }

  it('reports rows 3 and 4 on the second page, not 1 and 2', () => {
    const { result } = renderPaged()

    act(() => result.current.pagination.setPageIndex(1))

    const rows = result.current.table.getRowModel().rows
    expect(rows).toHaveLength(2)
    expect(result.current.a11y.getRowProps(rows[0].id)['aria-rowindex']).toBe(3)
    expect(result.current.a11y.getRowProps(rows[1].id)['aria-rowindex']).toBe(4)
  })

  it('reports the last row as index 5, matching aria-rowcount', () => {
    const { result } = renderPaged()

    act(() => result.current.pagination.setPageIndex(2))

    const rows = result.current.table.getRowModel().rows
    const rowCount = result.current.a11y.getTableProps()['aria-rowcount']
    expect(result.current.a11y.getRowProps(rows[0].id)['aria-rowindex']).toBe(rowCount)
  })

  it('follows sort order rather than original data order', () => {
    const { result } = renderHook(() => {
      const tableReturn = useTable({ data: users, columns, pagination: { pageSize: 2 } })
      return { ...tableReturn, a11y: useTableA11y(tableReturn.table) }
    })

    act(() => result.current.sorting.setSorting([{ id: 'name', desc: true }]))
    act(() => result.current.pagination.setPageIndex(1))

    // Sorted desc the order is User 4, 3, 2, 1, 0 — so page 2 holds User 2 and
    // User 1 at positions 3 and 4. Reading getFilteredRowModel() instead of the
    // pre-pagination model would place User 1 at 2, in original data order.
    const rows = result.current.table.getRowModel().rows
    expect(rows.map((r) => r.original.name)).toEqual(['User 2', 'User 1'])
    expect(result.current.a11y.getRowProps(rows[0].id)['aria-rowindex']).toBe(3)
    expect(result.current.a11y.getRowProps(rows[1].id)['aria-rowindex']).toBe(4)
  })
})

// ─── Roving tabindex is page-relative ─────────────────────

describe('useTableA11y — roving tabindex on a paginated table', () => {
  it('gives exactly one rendered row tabIndex=0 on every page', () => {
    const { result } = renderHook(() => {
      const tableReturn = useTable({ data: users, columns, pagination: { pageSize: 2 } })
      return { ...tableReturn, a11y: useTableA11y(tableReturn.table) }
    })

    act(() => result.current.pagination.setPageIndex(1))

    const rows = result.current.table.getRowModel().rows
    const tabbable = rows.filter((r) => result.current.a11y.getRowProps(r.id).tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0].id).toBe(rows[0].id)
  })
})

// ─── Opt-in cell navigation ───────────────────────────────

function renderCellNav(data: User[] = users) {
  return renderHook(() => {
    const tableReturn = useTable({ data, columns, pagination: false })
    const a11y = useTableA11y(tableReturn.table, { cellNavigation: true })
    return { ...tableReturn, a11y }
  })
}

function press(result: any, key: string, init: Partial<KeyboardEvent> = {}) {
  const rows = result.current.table.getRowModel().rows
  const cell = result.current.a11y.getCellProps(0, rows[0].id)
  act(() => {
    cell.onKeyDown!({
      key,
      preventDefault: () => {},
      ...init,
    } as unknown as React.KeyboardEvent)
  })
}

describe('useTableA11y — cell navigation is off by default', () => {
  it('omits tabIndex and onKeyDown from getCellProps', () => {
    const { result } = renderA11yHook()
    const props = result.current.a11y.getCellProps(0)
    expect('tabIndex' in props).toBe(false)
    expect('onKeyDown' in props).toBe(false)
  })

  it('still returns role and aria-colindex from the one-argument call', () => {
    const { result } = renderA11yHook()
    const props = result.current.a11y.getCellProps(1)
    expect(props.role).toBe('gridcell')
    expect(props['aria-colindex']).toBe(2)
  })
})

describe('useTableA11y — cellNavigation focus model', () => {
  it('starts with the first cell of the first row focused', () => {
    const { result } = renderCellNav()
    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 })
  })

  it('gives exactly one cell tabIndex=0 across the whole grid', () => {
    const { result } = renderCellNav()
    const rows = result.current.table.getRowModel().rows

    const tabbable = rows.flatMap((r, ri) =>
      [0, 1]
        .map((ci) => ({ ri, ci, props: result.current.a11y.getCellProps(ci, r.id) }))
        .filter((c) => c.props.tabIndex === 0)
    )

    expect(tabbable).toHaveLength(1)
    expect({ ri: tabbable[0].ri, ci: tabbable[0].ci }).toEqual({ ri: 0, ci: 0 })
  })

  it('ArrowRight moves to the next column and clamps at the last', () => {
    const { result } = renderCellNav()

    press(result, 'ArrowRight')
    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 0, columnIndex: 1 })

    press(result, 'ArrowRight')
    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 0, columnIndex: 1 })
  })

  it('ArrowLeft moves to the previous column and clamps at zero', () => {
    const { result } = renderCellNav()

    press(result, 'ArrowRight')
    press(result, 'ArrowLeft')
    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 })

    press(result, 'ArrowLeft')
    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 })
  })

  it('ArrowDown keeps the column while changing the row', () => {
    const { result } = renderCellNav()

    press(result, 'ArrowRight')
    press(result, 'ArrowDown')
    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 1, columnIndex: 1 })
  })

  it('ArrowUp clamps at the first row', () => {
    const { result } = renderCellNav()

    press(result, 'ArrowUp')
    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 })
  })
})

describe('useTableA11y — Home and End follow the ARIA grid pattern', () => {
  it('Home moves to the first cell of the current row, not the first row', () => {
    const { result } = renderCellNav()

    press(result, 'ArrowDown')
    press(result, 'ArrowRight')
    press(result, 'Home')

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 1, columnIndex: 0 })
  })

  it('End moves to the last cell of the current row', () => {
    const { result } = renderCellNav()

    press(result, 'ArrowDown')
    press(result, 'End')

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 1, columnIndex: 1 })
  })

  it('Ctrl+Home moves to the first cell of the grid', () => {
    const { result } = renderCellNav()

    press(result, 'ArrowDown')
    press(result, 'ArrowRight')
    press(result, 'Home', { ctrlKey: true })

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 0, columnIndex: 0 })
  })

  it('Ctrl+End moves to the last cell of the grid', () => {
    const { result } = renderCellNav()

    press(result, 'End', { ctrlKey: true })

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 4, columnIndex: 1 })
  })
})

describe('useTableA11y — row handler does not double-handle in cell mode', () => {
  it('leaves ArrowDown to the cell handler when cellNavigation is on', () => {
    const { result } = renderCellNav()
    const rows = result.current.table.getRowModel().rows

    // Simulate the real DOM path: the cell handles it, then it bubbles to the row.
    const cell = result.current.a11y.getCellProps(0, rows[0].id)
    const row = result.current.a11y.getRowProps(rows[0].id)
    act(() => {
      const e = { key: 'ArrowDown', preventDefault: () => {} } as React.KeyboardEvent
      cell.onKeyDown!(e)
      row.onKeyDown(e)
    })

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 1, columnIndex: 0 })
  })
})

// ─── PageUp / PageDown ────────────────────────────────────

describe('useTableA11y — PageDown and PageUp jump by a block of rows', () => {
  const many: User[] = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    role: 'Member',
  }))

  it('PageDown moves down ten rows, keeping the column', () => {
    const { result } = renderCellNav(many)

    press(result, 'ArrowRight')
    press(result, 'PageDown')

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 10, columnIndex: 1 })
  })

  it('PageUp moves back up ten rows', () => {
    const { result } = renderCellNav(many)

    press(result, 'PageDown')
    press(result, 'PageDown')
    press(result, 'PageUp')

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 10, columnIndex: 0 })
  })

  it('clamps at the last row rather than overshooting', () => {
    const { result } = renderCellNav(many)

    for (let i = 0; i < 5; i++) press(result, 'PageDown')

    expect(result.current.a11y.focusedCell).toEqual({ rowIndex: 29, columnIndex: 0 })
  })
})

// ─── Selection from a focused cell ────────────────────────

describe('useTableA11y — Enter and Space select the focused row in cell mode', () => {
  function renderSelectable() {
    return renderHook(() => {
      const tableReturn = useTable({ data: users, columns, rowSelection: true, pagination: false })
      const a11y = useTableA11y(tableReturn.table, {
        cellNavigation: true,
        selectionEnabled: true,
      })
      return { ...tableReturn, a11y }
    })
  }

  it('Enter toggles the row the focused cell belongs to, not the first row', () => {
    const { result } = renderSelectable()

    press(result, 'ArrowDown')
    press(result, 'ArrowRight')
    press(result, 'Enter')

    const rows = result.current.table.getRowModel().rows
    expect(rows[1].getIsSelected()).toBe(true)
    expect(rows[0].getIsSelected()).toBe(false)
  })

  it('Space toggles selection off again', () => {
    const { result } = renderSelectable()

    press(result, 'Enter')
    expect(result.current.table.getRowModel().rows[0].getIsSelected()).toBe(true)

    press(result, ' ')
    expect(result.current.table.getRowModel().rows[0].getIsSelected()).toBe(false)
  })

  it('does nothing when selectionEnabled is not set', () => {
    const { result } = renderCellNav()

    press(result, 'Enter')

    expect(result.current.table.getRowModel().rows[0].getIsSelected()).toBe(false)
  })
})

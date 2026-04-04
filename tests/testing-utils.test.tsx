import { describe, it, expect } from 'vitest'
import { createColumns } from '../src/helpers/createColumns'
import {
  renderTable,
  sortByColumn,
  goToPage,
  setPageSize,
  filterBy,
  filterByGlobal,
  filterByColumn,
  clearFilters,
  selectRow,
  selectAll,
  clearSelection,
  toggleColumnVisibility,
  hideColumn,
  showColumn,
} from '../testing'

// ─── Test data ────────────────────────────────────────────

type User = { id: number; name: string; email: string; role: string; age: number }

const testData: User[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@test.com', role: 'editor', age: 25 },
  { id: 3, name: 'Charlie', email: 'charlie@test.com', role: 'viewer', age: 35 },
  { id: 4, name: 'Diana', email: 'diana@test.com', role: 'admin', age: 28 },
  { id: 5, name: 'Eve', email: 'eve@test.com', role: 'editor', age: 22 },
  { id: 6, name: 'Frank', email: 'frank@test.com', role: 'viewer', age: 40 },
  { id: 7, name: 'Grace', email: 'grace@test.com', role: 'admin', age: 33 },
  { id: 8, name: 'Henry', email: 'henry@test.com', role: 'editor', age: 27 },
  { id: 9, name: 'Iris', email: 'iris@test.com', role: 'viewer', age: 31 },
  { id: 10, name: 'Jack', email: 'jack@test.com', role: 'admin', age: 29 },
  { id: 11, name: 'Kate', email: 'kate@test.com', role: 'editor', age: 26 },
  { id: 12, name: 'Leo', email: 'leo@test.com', role: 'viewer', age: 38 },
]

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'age', header: 'Age' },
])

// ─── renderTable ──────────────────────────────────────────

describe('renderTable', () => {
  it('returns all getter functions', () => {
    const result = renderTable({ data: testData, columns })

    expect(typeof result.table).toBe('function')
    expect(typeof result.rows).toBe('function')
    expect(typeof result.pagination).toBe('function')
    expect(typeof result.sorting).toBe('function')
    expect(typeof result.globalFilter).toBe('function')
    expect(typeof result.columnFilters).toBe('function')
    expect(typeof result.rowSelection).toBe('function')
    expect(typeof result.columnVisibility).toBe('function')
    expect(typeof result.emptyState).toBe('function')
  })

  it('rows() returns current visible rows', () => {
    const { rows } = renderTable({ data: testData, columns, pageSize: 5 })
    expect(rows()).toHaveLength(5)
  })

  it('supports pageSize shortcut', () => {
    const { pagination } = renderTable({ data: testData, columns, pageSize: 3 })
    expect(pagination().pageSize).toBe(3)
  })

  it('exposes raw renderHook result as escape hatch', () => {
    const { result } = renderTable({ data: testData, columns })
    expect(result.current).toBeDefined()
    expect(result.current.table).toBeDefined()
  })
})

// ─── Sorting ──────────────────────────────────────────────

describe('sortByColumn', () => {
  it('sorts ascending by default', () => {
    const { rows, sorting } = renderTable({ data: testData, columns, pagination: false })

    sortByColumn(sorting, 'name')
    expect(rows()[0].original.name).toBe('Alice')
    expect(rows()[rows().length - 1].original.name).toBe('Leo')
  })

  it('sorts descending when desc=true', () => {
    const { rows, sorting } = renderTable({ data: testData, columns, pagination: false })

    sortByColumn(sorting, 'name', true)
    expect(rows()[0].original.name).toBe('Leo')
  })

  it('reflects in sorting() getter', () => {
    const { sorting } = renderTable({ data: testData, columns })

    sortByColumn(sorting, 'age')
    expect(sorting().sortingState).toEqual([{ id: 'age', desc: false }])
  })
})

// ─── Pagination ───────────────────────────────────────────

describe('goToPage / setPageSize', () => {
  it('navigates to a specific page', () => {
    const { rows, pagination } = renderTable({ data: testData, columns, pageSize: 5 })

    expect(rows()).toHaveLength(5)
    expect(pagination().pageIndex).toBe(0)

    goToPage(pagination, 1)
    expect(pagination().pageIndex).toBe(1)
    expect(rows()).toHaveLength(5)

    goToPage(pagination, 2)
    expect(pagination().pageIndex).toBe(2)
    expect(rows()).toHaveLength(2) // 12 items, page 3 has 2
  })

  it('changes page size', () => {
    const { rows, pagination } = renderTable({ data: testData, columns, pageSize: 5 })

    setPageSize(pagination, 10)
    expect(pagination().pageSize).toBe(10)
    expect(rows()).toHaveLength(10)
  })
})

// ─── Global filter ────────────────────────────────────────

describe('filterBy (global)', () => {
  it('filters rows by global search', () => {
    const { rows, globalFilter } = renderTable({ data: testData, columns, pagination: false })

    filterBy(globalFilter, 'Alice')
    expect(rows()).toHaveLength(1)
    expect(rows()[0].original.name).toBe('Alice')
  })

  it('filterByGlobal also works', () => {
    const { rows, globalFilter } = renderTable({ data: testData, columns, pagination: false })

    filterByGlobal(globalFilter, 'Bob')
    expect(rows()).toHaveLength(1)
  })

  it('clearFilters clears global filter', () => {
    const { rows, globalFilter } = renderTable({ data: testData, columns, pagination: false })

    filterBy(globalFilter, 'Alice')
    expect(rows()).toHaveLength(1)

    clearFilters(globalFilter)
    expect(rows()).toHaveLength(12)
    expect(globalFilter().value).toBe('')
  })
})

// ─── Column filter ────────────────────────────────────────

describe('filterBy (column)', () => {
  it('filters rows by column value', () => {
    const { rows, columnFilters } = renderTable({ data: testData, columns, pagination: false })

    filterBy(columnFilters, 'role', 'admin')
    expect(rows().every((r) => r.original.role === 'admin')).toBe(true)
  })

  it('filterByColumn also works', () => {
    const { rows, columnFilters } = renderTable({ data: testData, columns, pagination: false })

    filterByColumn(columnFilters, 'role', 'editor')
    expect(rows().every((r) => r.original.role === 'editor')).toBe(true)
  })

  it('clearFilters clears all column filters', () => {
    const { rows, columnFilters } = renderTable({ data: testData, columns, pagination: false })

    filterBy(columnFilters, 'role', 'admin')
    expect(rows().length).toBeLessThan(12)

    clearFilters(columnFilters)
    expect(rows()).toHaveLength(12)
  })
})

// ─── Empty state ──────────────────────────────────────────

describe('emptyState', () => {
  it('reflects filtered empty correctly', () => {
    const { emptyState, globalFilter } = renderTable({ data: testData, columns, pagination: false })

    expect(emptyState().isEmpty).toBe(false)
    expect(emptyState().isFilteredEmpty).toBe(false)

    filterBy(globalFilter, 'nonexistent_value_xyz')
    expect(emptyState().isFilteredEmpty).toBe(true)
    expect(emptyState().isEmpty).toBe(false)
  })

  it('reflects true empty on empty data', () => {
    const { emptyState } = renderTable({ data: [] as User[], columns })
    expect(emptyState().isEmpty).toBe(true)
  })
})

// ─── Row selection ────────────────────────────────────────

describe('selectRow / selectAll / clearSelection', () => {
  it('selectRow toggles a row', () => {
    const { rowSelection } = renderTable({ data: testData, columns, rowSelection: true })

    selectRow(rowSelection, '0')
    expect(rowSelection().isSelected('0')).toBe(true)
    expect(rowSelection().selectedCount).toBe(1)

    selectRow(rowSelection, '0')
    expect(rowSelection().isSelected('0')).toBe(false)
  })

  it('selectAll selects all visible rows', () => {
    const { rowSelection } = renderTable({ data: testData, columns, rowSelection: true, pageSize: 5 })

    selectAll(rowSelection)
    expect(rowSelection().selectedCount).toBe(5)
  })

  it('clearSelection deselects all', () => {
    const { rowSelection } = renderTable({ data: testData, columns, rowSelection: true })

    selectRow(rowSelection, '0')
    selectRow(rowSelection, '1')
    clearSelection(rowSelection)
    expect(rowSelection().selectedCount).toBe(0)
  })
})

// ─── Column visibility ───────────────────────────────────

describe('toggleColumnVisibility / hideColumn / showColumn', () => {
  it('toggleColumnVisibility hides a column', () => {
    const { columnVisibility, table } = renderTable({
      data: testData,
      columns,
      columnVisibility: true,
    })

    toggleColumnVisibility(columnVisibility, 'email')
    expect(columnVisibility().hiddenColumns).toContain('email')

    const visibleIds = table().getVisibleLeafColumns().map((c) => c.id)
    expect(visibleIds).not.toContain('email')
  })

  it('hideColumn hides and showColumn restores', () => {
    const { columnVisibility, table } = renderTable({
      data: testData,
      columns,
      columnVisibility: true,
    })

    hideColumn(columnVisibility, 'age')
    expect(table().getVisibleLeafColumns().map((c) => c.id)).not.toContain('age')

    showColumn(columnVisibility, 'age')
    expect(table().getVisibleLeafColumns().map((c) => c.id)).toContain('age')
  })
})

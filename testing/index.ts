import { renderHook, act } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
import type { RowData, Table, Row } from '@tanstack/react-table'
import { useTable } from '../src/hooks/useTable'
import type {
  UseTableOptions,
  UseTableReturn,
  PaginationReturn,
  SortingReturn,
  GlobalFilterReturn,
  ColumnFiltersReturn,
  RowSelectionReturn,
  ColumnVisibilityReturn,
  EmptyStateReturn,
} from '../src/types'

// ─── Types ────────────────────────────────────────────────

export interface RenderTableOptions<TData extends RowData>
  extends Omit<UseTableOptions<TData>, 'pagination'> {
  /** Shortcut for pagination: { pageSize }. Pass full pagination object for more control. */
  pageSize?: number
  /** Full pagination options — overrides pageSize shortcut */
  pagination?: UseTableOptions<TData>['pagination']
}

export interface RenderTableResult<TData extends RowData> {
  /** Current TanStack Table instance */
  table: () => Table<TData>
  /** Current visible rows (respects pagination, sorting, filters) */
  rows: () => Row<TData>[]
  /** Current pagination state and helpers */
  pagination: () => PaginationReturn
  /** Current sorting state and helpers */
  sorting: () => SortingReturn
  /** Current global filter state and helpers */
  globalFilter: () => GlobalFilterReturn
  /** Current column filters state and helpers */
  columnFilters: () => ColumnFiltersReturn
  /** Current row selection state and helpers */
  rowSelection: () => RowSelectionReturn
  /** Current column visibility state and helpers */
  columnVisibility: () => ColumnVisibilityReturn
  /** Current empty state indicators */
  emptyState: () => EmptyStateReturn
  /** Escape hatch — raw renderHook result */
  result: RenderHookResult<UseTableReturn<TData>, unknown>['result']
}

// ─── renderTable ──────────────────────────────────────────

/**
 * Render a tablecraft table for testing. Returns getter functions
 * that always reflect the latest state.
 *
 * ```ts
 * const { rows, pagination, sorting } = renderTable({ data, columns, pageSize: 10 })
 * expect(rows()).toHaveLength(10)
 * ```
 */
export function renderTable<TData extends RowData>(
  options: RenderTableOptions<TData>
): RenderTableResult<TData> {
  const { pageSize, pagination, ...rest } = options

  const resolvedPagination = pagination ?? (pageSize ? { pageSize } : undefined)

  const { result } = renderHook(() =>
    useTable<TData>({
      ...rest,
      pagination: resolvedPagination,
    } as UseTableOptions<TData>)
  )

  return {
    table: () => result.current.table,
    rows: () => result.current.table.getRowModel().rows,
    pagination: () => result.current.pagination,
    sorting: () => result.current.sorting,
    globalFilter: () => result.current.globalFilter,
    columnFilters: () => result.current.columnFilters,
    rowSelection: () => result.current.rowSelection,
    columnVisibility: () => result.current.columnVisibility,
    emptyState: () => result.current.emptyState,
    result,
  }
}

// ─── Sorting helpers ──────────────────────────────────────

/**
 * Sort the table by a column. Defaults to ascending.
 *
 * ```ts
 * sortByColumn(sorting, 'name')           // ascending
 * sortByColumn(sorting, 'name', true)     // descending
 * ```
 */
export function sortByColumn(
  sorting: () => SortingReturn,
  columnId: string,
  desc = false
): void {
  act(() => {
    sorting().setSorting([{ id: columnId, desc }])
  })
}

// ─── Pagination helpers ───────────────────────────────────

/**
 * Navigate to a specific page (0-based index).
 *
 * ```ts
 * goToPage(pagination, 2)  // third page
 * ```
 */
export function goToPage(
  pagination: () => PaginationReturn,
  pageIndex: number
): void {
  act(() => {
    pagination().setPageIndex(pageIndex)
  })
}

/**
 * Change the page size.
 *
 * ```ts
 * setPageSize(pagination, 25)
 * ```
 */
export function setPageSize(
  pagination: () => PaginationReturn,
  size: number
): void {
  act(() => {
    pagination().setPageSize(size)
  })
}

// ─── Filter helpers ───────────────────────────────────────

/**
 * Set the global filter value.
 *
 * ```ts
 * filterBy(globalFilter, 'marvin')
 * ```
 */
export function filterByGlobal(
  globalFilter: () => GlobalFilterReturn,
  value: string
): void {
  act(() => {
    globalFilter().setValue(value)
  })
}

/**
 * Set a column filter value.
 *
 * ```ts
 * filterByColumn(columnFilters, 'role', 'admin')
 * ```
 */
export function filterByColumn(
  columnFilters: () => ColumnFiltersReturn,
  columnId: string,
  value: unknown
): void {
  act(() => {
    columnFilters().setFilter(columnId, value)
  })
}

/**
 * Overloaded filterBy — detects whether you're filtering globally or by column.
 *
 * ```ts
 * filterBy(globalFilter, 'search term')          // global filter
 * filterBy(columnFilters, 'role', 'admin')        // column filter
 * ```
 */
export function filterBy(
  target: () => GlobalFilterReturn,
  value: string
): void
export function filterBy(
  target: () => ColumnFiltersReturn,
  columnId: string,
  value: unknown
): void
export function filterBy(
  target: () => GlobalFilterReturn | ColumnFiltersReturn,
  columnIdOrValue: string,
  value?: unknown
): void {
  act(() => {
    const current = target()
    if ('setValue' in current) {
      // GlobalFilterReturn
      current.setValue(columnIdOrValue)
    } else {
      // ColumnFiltersReturn
      current.setFilter(columnIdOrValue, value)
    }
  })
}

/**
 * Clear filters. Works with both global filter and column filters.
 *
 * ```ts
 * clearFilters(globalFilter)    // clears global filter
 * clearFilters(columnFilters)   // clears all column filters
 * ```
 */
export function clearFilters(
  target: () => GlobalFilterReturn | ColumnFiltersReturn
): void {
  act(() => {
    const current = target()
    if ('clear' in current && typeof current.clear === 'function' && !('clearAll' in current)) {
      // GlobalFilterReturn
      current.clear()
    } else if ('clearAll' in current) {
      // ColumnFiltersReturn
      current.clearAll()
    }
  })
}

// ─── Row selection helpers ────────────────────────────────

/**
 * Toggle selection on a row by ID.
 *
 * ```ts
 * selectRow(rowSelection, '0')
 * ```
 */
export function selectRow(
  rowSelection: () => RowSelectionReturn,
  rowId: string
): void {
  act(() => {
    rowSelection().toggleRow(rowId)
  })
}

/**
 * Select all visible rows.
 *
 * ```ts
 * selectAll(rowSelection)
 * ```
 */
export function selectAll(
  rowSelection: () => RowSelectionReturn
): void {
  act(() => {
    rowSelection().toggleAll()
  })
}

/**
 * Clear all row selections.
 *
 * ```ts
 * clearSelection(rowSelection)
 * ```
 */
export function clearSelection(
  rowSelection: () => RowSelectionReturn
): void {
  act(() => {
    rowSelection().clearSelection()
  })
}

// ─── Column visibility helpers ────────────────────────────

/**
 * Toggle a column's visibility.
 *
 * ```ts
 * toggleColumnVisibility(columnVisibility, 'email')
 * ```
 */
export function toggleColumnVisibility(
  columnVisibility: () => ColumnVisibilityReturn,
  columnId: string
): void {
  act(() => {
    columnVisibility().toggleColumn(columnId)
  })
}

/**
 * Hide a column.
 *
 * ```ts
 * hideColumn(columnVisibility, 'email')
 * ```
 */
export function hideColumn(
  columnVisibility: () => ColumnVisibilityReturn,
  columnId: string
): void {
  act(() => {
    columnVisibility().hideColumn(columnId)
  })
}

/**
 * Show a hidden column.
 *
 * ```ts
 * showColumn(columnVisibility, 'email')
 * ```
 */
export function showColumn(
  columnVisibility: () => ColumnVisibilityReturn,
  columnId: string
): void {
  act(() => {
    columnVisibility().showColumn(columnId)
  })
}

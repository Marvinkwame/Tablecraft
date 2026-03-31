import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowData,
  SortingState,
  Table,
} from '@tanstack/react-table'

// ─── Pagination ───────────────────────────────────────────────

export interface PaginationOptions {
  pageSize?: number
  pageIndex?: number
}

export interface PaginationReturn {
  pageIndex: number
  pageSize: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
  previousPage: () => void
  nextPage: () => void
  setPageIndex: (index: number) => void
  setPageSize: (size: number) => void
}

// ─── Sorting ──────────────────────────────────────────────────

export interface SortingOptions {
  defaultSort?: SortingState
}

export interface SortingReturn {
  sortingState: SortingState
  setSorting: OnChangeFn<SortingState>
  clearSorting: () => void
}

// ─── Global Filter ────────────────────────────────────────────

export interface GlobalFilterReturn {
  value: string
  setValue: (val: string) => void
  clear: () => void
}

// ─── Column Filters ───────────────────────────────────────────

export interface ColumnFiltersReturn {
  state: ColumnFiltersState
  setFilter: (columnId: string, value: unknown) => void
  clearFilter: (columnId: string) => void
  clearAll: () => void
}

// ─── useTable Options ─────────────────────────────────────────

export interface UseTableOptions<TData extends RowData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]

  // Pagination
  pagination?: PaginationOptions | boolean
  manualPagination?: boolean
  rowCount?: number
  onPaginationChange?: OnChangeFn<PaginationState>

  // Sorting
  sorting?: SortingOptions | boolean
  manualSorting?: boolean
  onSortingChange?: OnChangeFn<SortingState>

  // Filters
  globalFilter?: boolean
  onGlobalFilterChange?: (value: string) => void
  columnFilters?: boolean
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
}

// ─── useTable Return ──────────────────────────────────────────

export interface UseTableReturn<TData extends RowData> {
  table: Table<TData>
  pagination: PaginationReturn
  sorting: SortingReturn
  globalFilter: GlobalFilterReturn
  columnFilters: ColumnFiltersReturn
}

// ─── useServerTable Options ───────────────────────────────────

export interface UseServerTableOptions<TData extends RowData>
  extends Omit<UseTableOptions<TData>, 'manualPagination' | 'manualSorting'> {
  rowCount: number
  onPaginationChange?: OnChangeFn<PaginationState>
  onSortingChange?: OnChangeFn<SortingState>
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
}

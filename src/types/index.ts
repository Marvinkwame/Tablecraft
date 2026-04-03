import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowData,
  RowSelectionState,
  SortingState,
  Table,
  VisibilityState,
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

// ─── Row Selection ──────────────────────────────────────

export interface RowSelectionOptions {
  defaultSelection?: RowSelectionState
  enableMultiRowSelection?: boolean
}

export interface RowSelectionReturn {
  state: RowSelectionState
  toggleRow: (rowId: string) => void
  toggleAll: () => void
  clearSelection: () => void
  selectedRowIds: string[]
  selectedCount: number
  isSelected: (rowId: string) => boolean
}

// ─── Column Visibility ──────────────────────────────────

export interface ColumnVisibilityOptions {
  defaultVisibility?: VisibilityState
}

export interface ColumnVisibilityReturn {
  state: VisibilityState
  toggleColumn: (columnId: string) => void
  showColumn: (columnId: string) => void
  hideColumn: (columnId: string) => void
  showAll: () => void
  hiddenColumns: string[]
}

// ─── Empty State ─────────────────────────────────────────────

export interface EmptyStateReturn {
  /** True when data has 0 rows total */
  isEmpty: boolean
  /** True when data exists but filters return 0 rows */
  isFilteredEmpty: boolean
}

// ─── Persist ─────────────────────────────────────────────────

export type PersistStorage = 'localStorage' | 'sessionStorage'

export interface PersistOptions {
  sorting?: boolean
  columnFilters?: boolean
  globalFilter?: boolean
  pagination?: boolean
}

// ─── URL Sync ───────────────────────────────────────────────

export interface URLKeyMap {
  /** URL param key for page number (default: 'page') */
  page?: string
  /** URL param key for page size (default: 'pageSize') */
  pageSize?: string
  /** URL param key for sorting (default: 'sort') */
  sort?: string
  /** URL param key for global filter (default: 'filter') */
  filter?: string
  /** Prefix for column filter params (default: 'filter_') */
  columnFilterPrefix?: string
}

export interface URLSyncOptions {
  /** Custom URL parameter key mapping */
  keys?: URLKeyMap
  /** History mode: 'replace' (default, no back-button pollution) or 'push' */
  mode?: 'replace' | 'push'
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

  // Row selection (opt-in)
  rowSelection?: RowSelectionOptions | boolean

  // Column visibility (opt-in)
  columnVisibility?: ColumnVisibilityOptions | boolean

  // v1.x — Fuzzy search
  fuzzy?: boolean

  // v1.x — State persistence
  persist?: PersistStorage | false
  persistKey?: string
  persistOptions?: PersistOptions

  // v2 — URL state sync
  syncUrl?: boolean | URLSyncOptions
}

// ─── useTable Return ──────────────────────────────────────────

export interface UseTableReturn<TData extends RowData> {
  table: Table<TData>
  pagination: PaginationReturn
  sorting: SortingReturn
  globalFilter: GlobalFilterReturn
  columnFilters: ColumnFiltersReturn
  rowSelection: RowSelectionReturn
  columnVisibility: ColumnVisibilityReturn
  emptyState: EmptyStateReturn
}

// ─── useServerTable Options ───────────────────────────────────

export interface UseServerTableOptions<TData extends RowData>
  extends Omit<UseTableOptions<TData>, 'manualPagination' | 'manualSorting'> {
  rowCount: number
  onPaginationChange?: OnChangeFn<PaginationState>
  onSortingChange?: OnChangeFn<SortingState>
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
}

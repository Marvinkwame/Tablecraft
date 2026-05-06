import type React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ExpandedState,
  GroupingState,
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

// ─── Row Expansion ──────────────────────────────────────

export interface RowExpansionOptions {
  defaultExpanded?: ExpandedState
  allowMultiple?: boolean
  paginateExpandedRows?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSubRows?: (row: any, index: number) => any[] | undefined
}

export interface RowExpansionReturn {
  state: ExpandedState
  toggleRow: (rowId: string) => void
  expandRow: (rowId: string) => void
  collapseRow: (rowId: string) => void
  clearExpansion: () => void
  expandedRowIds: string[]
  isExpanded: (rowId: string) => boolean
}

// ─── A11y ────────────────────────────────────────────────────

export interface TableA11yReturn {
  getTableProps: () => {
    role: 'grid'
    'aria-rowcount': number
    'aria-colcount': number
  }
  getHeaderProps: (headerId: string) => {
    role: 'columnheader'
    'aria-sort': 'ascending' | 'descending' | 'none'
  }
  getRowProps: (rowId: string) => {
    role: 'row'
    'aria-rowindex': number
    'aria-selected'?: boolean
    'aria-expanded'?: boolean
    tabIndex: 0 | -1
    onKeyDown: (e: React.KeyboardEvent) => void
  }
  getCellProps: (columnIndex: number) => {
    role: 'gridcell'
    'aria-colindex': number
  }
  focusedRowIndex: number | null
}

// ─── Editable Rows ───────────────────────────────────────────

export interface EditableOptions<TData> {
  onSave?: (
    rowId: string,
    draft: TData
  ) =>
    | void
    | Partial<Record<keyof TData, string>>
    | Promise<void | Partial<Record<keyof TData, string>>>
}

export interface EditableReturn<TData> {
  editingRowId: string | null
  draftData: Partial<TData>
  isDirty: boolean
  dirtyFields: (keyof TData)[]
  errors: Partial<Record<keyof TData, string>>
  isSaving: boolean
  isEditing: (rowId: string) => boolean
  startEditing: (rowId: string) => void
  setField: <K extends keyof TData>(field: K, value: TData[K]) => void
  saveEditing: () => Promise<void>
  cancelEditing: () => void
}

// ─── Grouping ────────────────────────────────────────────────

export interface GroupingOptions {
  defaultGrouping?: GroupingState
  manualGrouping?: boolean
  groupedColumnMode?: false | 'reorder' | 'remove'
}

export interface GroupingReturn {
  state: GroupingState
  toggleGrouping: (columnId: string) => void
  setGrouping: (cols: GroupingState) => void
  clearGrouping: () => void
  isGrouped: (columnId: string) => boolean
  groupedColumns: string[]
}

// ─── Column Pinning ──────────────────────────────────────

export interface ColumnPinningOptions {
  defaultPinning?: ColumnPinningState   // { left?: string[], right?: string[] }
}

export interface ColumnPinningReturn {
  state: ColumnPinningState
  pinLeft: (columnId: string) => void
  pinRight: (columnId: string) => void
  unpin: (columnId: string) => void
  clearPinning: () => void
  isPinned: (columnId: string) => 'left' | 'right' | false
  leftColumns: string[]
  rightColumns: string[]
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

// ─── TableKitProvider Defaults ───────────────────────────────

export interface TableKitDefaults {
  /** Default page size for all tables */
  pageSize?: number
  /** Enable fuzzy search by default */
  fuzzy?: boolean
  /** Enable row selection by default */
  rowSelection?: RowSelectionOptions | boolean
  /** Enable column visibility by default */
  columnVisibility?: ColumnVisibilityOptions | boolean
  /** Enable global filter by default */
  globalFilter?: boolean
  /** Enable column filters by default */
  columnFilters?: boolean
  /** Default persistence strategy */
  persist?: PersistStorage | false
  /** Default persist options */
  persistOptions?: PersistOptions
  /** Default URL sync */
  syncUrl?: boolean | URLSyncOptions
  /** Enable row expansion by default */
  rowExpansion?: RowExpansionOptions | boolean
  /** Enable row grouping by default */
  grouping?: GroupingOptions | boolean
  /** Enable column pinning by default */
  columnPinning?: ColumnPinningOptions | boolean
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

  // Row expansion (opt-in)
  rowExpansion?: RowExpansionOptions | boolean

  // Grouping (opt-in)
  grouping?: GroupingOptions | boolean

  // Column pinning (opt-in)
  columnPinning?: ColumnPinningOptions | boolean

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
  rowExpansion: RowExpansionReturn
  grouping: GroupingReturn
  columnPinning: ColumnPinningReturn
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

import type {
  ColumnDef,
  ColumnFiltersState,
  GroupingState,
  RowData,
  SortingState,
  Table,
} from '@tanstack/react-table'
import type {
  PaginationOptions,
  SortingOptions,
  RowExpansionOptions,
  RowSelectionOptions,
  ColumnVisibilityOptions,
  ColumnPinningOptions,
  ColumnPinningReturn,
  GroupingOptions,
  PersistStorage,
  PersistOptions,
  URLSyncOptions,
  UseTableReturn,
  SortingReturn,
  GlobalFilterReturn,
  ColumnFiltersReturn,
  RowSelectionReturn,
  ColumnVisibilityReturn,
  GroupingReturn,
  EmptyStateReturn,
} from './index'

// ─── Query Function Types ─────────────────────────────────

/** Context passed to the queryFn — contains current table state */
export interface QueryTableFnContext {
  pagination: { pageIndex: number; pageSize: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  grouping: GroupingState
}

/** Expected return shape from the queryFn */
export interface QueryTableResult<TData> {
  data: TData[]
  rowCount: number
}

// ─── useQueryTable Options ────────────────────────────────

export interface UseQueryTableOptions<TData extends RowData> {
  // Required — Query
  queryKey: unknown[]
  queryFn: (context: QueryTableFnContext) => Promise<QueryTableResult<TData>>

  // Required — Table
  columns: ColumnDef<TData, any>[]

  // Table options (optional)
  pagination?: PaginationOptions | boolean
  sorting?: SortingOptions | boolean
  globalFilter?: boolean
  columnFilters?: boolean
  rowSelection?: RowSelectionOptions | boolean
  columnVisibility?: ColumnVisibilityOptions | boolean
  rowExpansion?: RowExpansionOptions | boolean
  grouping?: GroupingOptions | boolean
  columnPinning?: ColumnPinningOptions | boolean
  fuzzy?: boolean
  persist?: PersistStorage | false
  persistKey?: string
  persistOptions?: PersistOptions

  // URL state sync
  syncUrl?: boolean | URLSyncOptions

  // TanStack Query options (common ones surfaced for autocomplete)
  staleTime?: number
  gcTime?: number
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean | 'always'
  refetchOnReconnect?: boolean | 'always'
  refetchInterval?: number | false
  retry?: boolean | number

  /** Pass-through for any TanStack Query option not explicitly surfaced */
  queryOptions?: Record<string, unknown>
}

// ─── useQueryTable Return ─────────────────────────────────

/** Raw query result shape — structural type to avoid requiring @tanstack/react-query at type level */
export interface QueryState<TData> {
  data: QueryTableResult<TData> | undefined
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  isPlaceholderData: boolean
  error: Error | null
  refetch: () => Promise<unknown>
  status: 'pending' | 'error' | 'success'
  fetchStatus: 'fetching' | 'paused' | 'idle'
}

export interface UseQueryTableReturn<TData extends RowData>
  extends UseTableReturn<TData> {
  /** Raw useQuery result for loading/error UI */
  query: QueryState<TData>
}

// ─── Infinite Query Function Types ───────────────────────

/** Context passed to the useInfiniteTable queryFn */
export interface InfiniteTableFnContext<TCursor = unknown> {
  pageParam: TCursor           // cursor, offset, or page number — consumer controls type
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  grouping: GroupingState
}

/** Expected return shape from the useInfiniteTable queryFn.
 *  nextCursor === undefined signals no more pages (sets hasNextPage: false). */
export interface InfiniteTableResult<TData, TCursor = unknown> {
  data: TData[]
  nextCursor?: TCursor
}

// ─── useInfiniteTable Options ─────────────────────────────

export interface UseInfiniteTableOptions<TData extends RowData, TCursor = unknown> {
  // Required
  queryKey: unknown[]
  queryFn: (context: InfiniteTableFnContext<TCursor>) => Promise<InfiniteTableResult<TData, TCursor>>
  columns: ColumnDef<TData, any>[]

  // Infinite-specific
  initialPageParam?: TCursor          // infers TCursor automatically

  // Table feature toggles (same opt-in pattern as UseQueryTableOptions)
  sorting?: SortingOptions | boolean
  globalFilter?: boolean
  columnFilters?: boolean
  rowSelection?: RowSelectionOptions | boolean
  columnVisibility?: ColumnVisibilityOptions | boolean
  grouping?: GroupingOptions | boolean
  columnPinning?: ColumnPinningOptions | boolean

  // TanStack Query passthrough
  staleTime?: number
  gcTime?: number
  enabled?: boolean
}

// ─── useInfiniteTable Return ──────────────────────────────

export interface UseInfiniteTableReturn<TData extends RowData> {
  table: Table<TData>

  // State accessors
  sorting: SortingReturn
  globalFilter: GlobalFilterReturn
  columnFilters: ColumnFiltersReturn
  rowSelection: RowSelectionReturn
  columnVisibility: ColumnVisibilityReturn
  grouping: GroupingReturn
  columnPinning: ColumnPinningReturn
  emptyState: EmptyStateReturn

  // Infinite-specific
  loadMore: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean

  // Query status (flattened — no sub-object, simpler than useQueryTable)
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

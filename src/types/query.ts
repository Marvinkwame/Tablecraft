import type {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
} from '@tanstack/react-table'
import type {
  PaginationOptions,
  SortingOptions,
  PersistStorage,
  PersistOptions,
  UseTableReturn,
} from './index'

// ─── Query Function Types ─────────────────────────────────

/** Context passed to the queryFn — contains current table state */
export interface QueryTableFnContext {
  pagination: { pageIndex: number; pageSize: number }
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
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
  fuzzy?: boolean
  persist?: PersistStorage | false
  persistKey?: string
  persistOptions?: PersistOptions

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

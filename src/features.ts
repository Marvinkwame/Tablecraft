import {
  tableFeatures,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnVisibilityFeature,
  columnFacetingFeature,
  columnSizingFeature,
  columnOrderingFeature,
  rowPinningFeature,
  createFilteredRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
  createGroupedRowModel,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFacetedMinMaxValues,
  filterFns,
  sortFns,
  aggregationFns,
} from '@tanstack/react-table'
import type { RowData, Table } from '@tanstack/react-table'

/**
 * The one bound feature set for every tablecraft table.
 *
 * v9 resolves a table's methods conditionally on which features are
 * registered, so a wrapper cannot leave the feature set generic AND promise
 * `pagination` in its return type — the compiler cannot prove the method
 * exists. Binding one concrete set is what keeps `useTable().pagination`
 * typed, and what lets consumers keep a single type parameter.
 *
 * The cost is no tree-shaking, which is bundle parity with v8 rather than a
 * regression. Preset-bound entries (a `/core` with a smaller set) are the
 * escape hatch if anyone asks; they are additive and need not ship here.
 *
 * Defined at module scope deliberately: TanStack's migration guide calls for
 * defining it statically outside render work, and a fresh object each render
 * would rebuild the table's feature registry every time.
 *
 * A feature left out of this object does not fail to compile — its methods
 * are simply absent from the table instance at runtime, so calling one
 * throws (or reads as `undefined`) with no compile-time signal. Any future
 * tablecraft capability that leans on a v9 feature (column resizing, cell
 * selection, and so on) must be registered here too, or its methods will be
 * silently missing rather than caught by the type checker.
 */
export const tablecraftFeatures = tableFeatures({
  // Features first, then their row-model slots — prerequisites before
  // dependents, so inference and diagnostics stay readable.
  columnFilteringFeature,
  globalFilteringFeature, // requires columnFilteringFeature
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  columnFacetingFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnOrderingFeature,
  rowPinningFeature,

  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),

  // The FULL registries, not a hand-picked subset. A slot's keys are the only
  // valid string names in a column definition, and tablecraft's consumers
  // write their own columns — under v8 every built-in name resolved, and
  // narrowing this would break them silently.
  filterFns,
  sortFns,
  // Pairs with rowAggregationFeature the same way filterFns pairs with
  // columnFilteringFeature: without it, a column's aggregationFn: 'sum'
  // would not resolve. tablecraft wraps grouping, and aggregation is what
  // grouped columns use.
  aggregationFns,
})

export type TablecraftFeatures = typeof tablecraftFeatures

/**
 * The table instance type consumers should use.
 *
 * v9's `Table` takes `Table<TFeatures, TData>`. This alias binds the first
 * parameter so consumers keep writing one type argument, exactly as they did
 * with v8's `Table<TData>`.
 */
export type TablecraftTable<TData extends RowData> = Table<TablecraftFeatures, TData>

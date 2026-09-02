// Hooks
export { useTable } from './hooks/useTable'
export { useServerTable } from './hooks/useServerTable'
export { usePaginationState } from './hooks/usePaginationState'
export { useSortState } from './hooks/useSortState'
export { useFilterState } from './hooks/useFilterState'
export { useColumnFilterState } from './hooks/useColumnFilterState'
export { useRowSelectionState } from './hooks/useRowSelectionState'
export { useColumnVisibilityState } from './hooks/useColumnVisibilityState'
export { useColumnPinningState } from './hooks/useColumnPinningState'
export { useRowExpansionState } from './hooks/useRowExpansionState'
export { useGroupingState } from './hooks/useGroupingState'
export { useTableA11y } from './hooks/useTableA11y'
export type { UseTableA11yOptions } from './hooks/useTableA11y'
export { useEditableRows } from './hooks/useEditableRows'
export { useMultiRowEditing } from './hooks/useMultiRowEditing'
// Hooks backed by an optional peer are NOT exported here — a static import has
// to resolve even when tree-shaking drops it, so re-exporting them would make
// their peer mandatory for everyone. Import them from their own entry instead:
//   useQueryTable, useInfiniteTable → '@marvinackerman/tablecraft/query'
//   useVirtualRows                  → '@marvinackerman/tablecraft/virtual'
export { useInfiniteScroll } from './hooks/useInfiniteScroll'
export type { UseInfiniteScrollOptions } from './hooks/useInfiniteScroll'
export { useTableExport } from './hooks/useTableExport'

// Context
export { TableKitProvider, useTableKitDefaults } from './context/TableKitContext'
export type { TableKitProviderProps } from './context/TableKitContext'

// Helpers
export { createColumns } from './helpers/createColumns'
export { inferColumns } from './helpers/inferColumns'

// Utilities
export { loadPersistedState, savePersistedState, clearPersistedState } from './utils/persist'
export { parseURLState, writeURLState, resolveURLKeys } from './utils/url'

// Types
export type {
  UseTableOptions,
  UseTableReturn,
  UseServerTableOptions,
  PaginationOptions,
  PaginationReturn,
  SortingOptions,
  SortingReturn,
  GlobalFilterReturn,
  ColumnFiltersReturn,
  RowSelectionOptions,
  RowSelectionReturn,
  ColumnVisibilityOptions,
  ColumnVisibilityReturn,
  RowExpansionOptions,
  RowExpansionReturn,
  GroupingOptions,
  GroupingReturn,
  TableA11yReturn,
  EditableOptions,
  EditableReturn,
  MultiRowEditingOptions,
  MultiRowEditingReturn,
  EmptyStateReturn,
  TableKitDefaults,
  PersistStorage,
  PersistOptions,
  UseTableExportOptions,
  DownloadOptions,
  TableExportReturn,
} from './types'

export type { InferColumnsOptions } from './helpers/inferColumns'
export type { UseRowSelectionOptions } from './hooks/useRowSelectionState'
export type { UseColumnVisibilityOptions } from './hooks/useColumnVisibilityState'
export type { UseRowExpansionOptions } from './hooks/useRowExpansionState'
export type { UseGroupingOptions } from './hooks/useGroupingState'
export type { UseColumnPinningOptions } from './hooks/useColumnPinningState'
export type { ColumnPinningOptions, ColumnPinningReturn } from './types'

// A11y utilities
export {
  getAriaSortValue,
  getAriaRowCount,
  getAriaColCount,
  getAriaRowIndex,
} from './a11y/ariaAttributes'


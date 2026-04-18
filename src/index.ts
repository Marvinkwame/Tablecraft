// Hooks
export { useTable } from './hooks/useTable'
export { useServerTable } from './hooks/useServerTable'
export { usePaginationState } from './hooks/usePaginationState'
export { useSortState } from './hooks/useSortState'
export { useFilterState } from './hooks/useFilterState'
export { useColumnFilterState } from './hooks/useColumnFilterState'
export { useRowSelectionState } from './hooks/useRowSelectionState'
export { useColumnVisibilityState } from './hooks/useColumnVisibilityState'
export { useRowExpansionState } from './hooks/useRowExpansionState'
export { useGroupingState } from './hooks/useGroupingState'
export { useTableA11y } from './hooks/useTableA11y'
export type { UseTableA11yOptions } from './hooks/useTableA11y'
export { useQueryTable } from './hooks/useQueryTable'

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
  EmptyStateReturn,
  TableKitDefaults,
  PersistStorage,
  PersistOptions,
} from './types'

export type { InferColumnsOptions } from './helpers/inferColumns'
export type { UseRowSelectionOptions } from './hooks/useRowSelectionState'
export type { UseColumnVisibilityOptions } from './hooks/useColumnVisibilityState'
export type { UseRowExpansionOptions } from './hooks/useRowExpansionState'
export type { UseGroupingOptions } from './hooks/useGroupingState'

// A11y utilities
export {
  getAriaSortValue,
  getAriaRowCount,
  getAriaColCount,
  getAriaRowIndex,
} from './a11y/ariaAttributes'

export type {
  UseQueryTableOptions,
  UseQueryTableReturn,
  QueryTableFnContext,
  QueryTableResult,
  QueryState,
} from './types/query'

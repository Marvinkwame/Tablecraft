import type { PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table'

export type PersistStorage = 'localStorage' | 'sessionStorage'

export interface PersistableState {
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
  globalFilter?: string
  pagination?: PaginationState
}

export interface PersistOptions {
  /** Which state slices to persist. Defaults to all except pagination. */
  sorting?: boolean
  columnFilters?: boolean
  globalFilter?: boolean
  pagination?: boolean
}

const DEFAULT_PERSIST_OPTIONS: Required<PersistOptions> = {
  sorting: true,
  columnFilters: true,
  globalFilter: true,
  pagination: false,
}

function getStorage(storage: PersistStorage): Storage | null {
  try {
    return storage === 'localStorage' ? window.localStorage : window.sessionStorage
  } catch {
    // SSR or restricted environment
    return null
  }
}

/**
 * Load persisted table state from storage.
 */
export function loadPersistedState(
  storage: PersistStorage,
  key: string,
  options: PersistOptions = {}
): Partial<PersistableState> {
  const store = getStorage(storage)
  if (!store) return {}

  try {
    const raw = store.getItem(`tablecraft:${key}`)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as PersistableState
    const opts = { ...DEFAULT_PERSIST_OPTIONS, ...options }
    const result: Partial<PersistableState> = {}

    if (opts.sorting && parsed.sorting) result.sorting = parsed.sorting
    if (opts.columnFilters && parsed.columnFilters) result.columnFilters = parsed.columnFilters
    if (opts.globalFilter && parsed.globalFilter) result.globalFilter = parsed.globalFilter
    if (opts.pagination && parsed.pagination) result.pagination = parsed.pagination

    return result
  } catch {
    return {}
  }
}

/**
 * Save table state to storage.
 */
export function savePersistedState(
  storage: PersistStorage,
  key: string,
  state: PersistableState,
  options: PersistOptions = {}
): void {
  const store = getStorage(storage)
  if (!store) return

  const opts = { ...DEFAULT_PERSIST_OPTIONS, ...options }
  const toSave: PersistableState = {}

  if (opts.sorting) toSave.sorting = state.sorting
  if (opts.columnFilters) toSave.columnFilters = state.columnFilters
  if (opts.globalFilter) toSave.globalFilter = state.globalFilter
  if (opts.pagination) toSave.pagination = state.pagination

  try {
    store.setItem(`tablecraft:${key}`, JSON.stringify(toSave))
  } catch {
    // Storage full or restricted — fail silently
  }
}

/**
 * Clear persisted table state.
 */
export function clearPersistedState(
  storage: PersistStorage,
  key: string
): void {
  const store = getStorage(storage)
  if (!store) return

  try {
    store.removeItem(`tablecraft:${key}`)
  } catch {
    // fail silently
  }
}

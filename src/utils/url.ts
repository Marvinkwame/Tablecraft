import type { PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import type { URLKeyMap } from '../types'
import type { PersistableState } from './persist'

// ─── Default key map ───────────────────────────────────────

const DEFAULT_KEYS: Required<URLKeyMap> = {
  page: 'page',
  pageSize: 'pageSize',
  sort: 'sort',
  filter: 'filter',
  columnFilterPrefix: 'filter_',
}

/**
 * Merge user-provided URL keys with defaults.
 */
export function resolveURLKeys(keys?: URLKeyMap): Required<URLKeyMap> {
  if (!keys) return { ...DEFAULT_KEYS }
  return { ...DEFAULT_KEYS, ...keys }
}

// ─── SSR-safe helpers ──────────────────────────────────────

function getSearchParams(): URLSearchParams | null {
  try {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search)
  } catch {
    return null
  }
}

// ─── Parse URL → State ────────────────────────────────────

/**
 * Read current URL search params and return table state.
 * Returns only the slices that are present in the URL.
 */
export function parseURLState(keys: Required<URLKeyMap>): Partial<PersistableState> {
  const params = getSearchParams()
  if (!params) return {}

  const result: Partial<PersistableState> = {}

  // Pagination
  const pageStr = params.get(keys.page)
  const pageSizeStr = params.get(keys.pageSize)

  if (pageStr || pageSizeStr) {
    const pagination: PaginationState = {
      pageIndex: 0,
      pageSize: 10,
    }

    if (pageStr) {
      const parsed = parseInt(pageStr, 10)
      if (Number.isFinite(parsed) && parsed >= 1) {
        pagination.pageIndex = parsed - 1 // URL is 1-based, state is 0-based
      }
    }

    if (pageSizeStr) {
      const parsed = parseInt(pageSizeStr, 10)
      if (Number.isFinite(parsed) && parsed >= 1) {
        pagination.pageSize = parsed
      }
    }

    result.pagination = pagination
  }

  // Sorting: "name_asc,created_at_desc"
  const sortStr = params.get(keys.sort)
  if (sortStr) {
    const sorting: SortingState = sortStr
      .split(',')
      .map((segment) => {
        const trimmed = segment.trim()
        if (!trimmed) return null

        // Split on last underscore to handle column IDs with underscores
        const lastUnderscore = trimmed.lastIndexOf('_')
        if (lastUnderscore === -1) return null

        const id = trimmed.substring(0, lastUnderscore)
        const dir = trimmed.substring(lastUnderscore + 1)

        if (!id || (dir !== 'asc' && dir !== 'desc')) return null

        return { id, desc: dir === 'desc' }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)

    if (sorting.length > 0) {
      result.sorting = sorting
    }
  }

  // Global filter
  const filterStr = params.get(keys.filter)
  if (filterStr !== null && filterStr !== '') {
    result.globalFilter = filterStr
  }

  // Column filters: find all params starting with prefix
  const columnFilters: ColumnFiltersState = []
  const prefix = keys.columnFilterPrefix

  params.forEach((value, key) => {
    if (key.startsWith(prefix)) {
      const columnId = key.substring(prefix.length)
      if (columnId) {
        columnFilters.push({ id: columnId, value })
      }
    }
  })

  if (columnFilters.length > 0) {
    result.columnFilters = columnFilters
  }

  return result
}

// ─── Write State → URL ────────────────────────────────────

/**
 * Write table state to URL search params via replaceState or pushState.
 * Omits default values to keep URLs clean.
 */
export function writeURLState(
  state: PersistableState,
  keys: Required<URLKeyMap>,
  mode: 'replace' | 'push' = 'replace'
): void {
  try {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)

    // ─── Pagination ────────────────────────────────────
    if (state.pagination) {
      const { pageIndex, pageSize } = state.pagination

      // Omit page=1 (default first page)
      if (pageIndex > 0) {
        params.set(keys.page, String(pageIndex + 1)) // 0-based → 1-based
      } else {
        params.delete(keys.page)
      }

      // Always include pageSize when set
      params.set(keys.pageSize, String(pageSize))
    } else {
      params.delete(keys.page)
      params.delete(keys.pageSize)
    }

    // ─── Sorting ───────────────────────────────────────
    if (state.sorting && state.sorting.length > 0) {
      const sortStr = state.sorting
        .map((s) => `${s.id}_${s.desc ? 'desc' : 'asc'}`)
        .join(',')
      params.set(keys.sort, sortStr)
    } else {
      params.delete(keys.sort)
    }

    // ─── Global filter ─────────────────────────────────
    if (state.globalFilter && state.globalFilter !== '') {
      params.set(keys.filter, state.globalFilter)
    } else {
      params.delete(keys.filter)
    }

    // ─── Column filters ────────────────────────────────
    // Clear existing column filter params first
    const prefix = keys.columnFilterPrefix
    const keysToDelete: string[] = []
    params.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => params.delete(key))

    // Set new column filters
    if (state.columnFilters) {
      for (const cf of state.columnFilters) {
        params.set(`${prefix}${cf.id}`, String(cf.value))
      }
    }

    // ─── Update URL ────────────────────────────────────
    const paramString = params.toString()
    const newUrl = paramString
      ? `${window.location.pathname}?${paramString}`
      : window.location.pathname

    if (mode === 'push') {
      window.history.pushState(null, '', newUrl)
    } else {
      window.history.replaceState(null, '', newUrl)
    }
  } catch {
    // SSR or restricted environment — fail silently
  }
}

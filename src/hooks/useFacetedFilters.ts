'use client'

import type { RowData, Table } from '@tanstack/react-table'
import type { ColumnFacet, FacetedFiltersReturn } from '../types'
import {
  buildFacetOptions,
  normalizeSelected,
  toggleValue,
} from '../utils/facets'

/**
 * A facet with nothing in it and inert handlers. Returned for an unknown column
 * id and for server-backed tables. Built fresh each time so a consumer mutating
 * `options` cannot corrupt a shared constant.
 */
function emptyFacet(): ColumnFacet {
  return {
    options: [],
    selected: [],
    toggle: () => {},
    isSelected: () => false,
    clear: () => {},
  }
}

export function useFacetedFilters<TData extends RowData>(
  table: Table<TData>
): FacetedFiltersReturn {
  // Facets need the whole dataset. A table with manualPagination holds one
  // page, so counts computed from it would describe the page rather than the
  // data - plausible and wrong. There is no `manualFiltering` flag in this
  // codebase; manualPagination is the signal that the data is remote.
  const isServerTable = table.options.manualPagination === true

  // A plain function, not useCallback: every value below is read from the table
  // at call time, so there is nothing stale to memoize away. A deps array would
  // have to include columnFilters and would therefore change on every filter
  // change anyway, buying no referential stability.
  const getFacet = (columnId: string): ColumnFacet => {
    const column = table.getColumn(columnId)
    if (!column || isServerTable) return emptyFacet()

    const selected = normalizeSelected(column.getFilterValue())
    const options = buildFacetOptions(column.getFacetedUniqueValues(), selected)

    // Writing undefined rather than [] removes the filter entry. An empty
    // array matches nothing, which would blank the table - the opposite of
    // what unchecking the last box means.
    const setSelected = (next: unknown[]) => {
      column.setFilterValue(next.length > 0 ? next : undefined)
    }

    return {
      options,
      selected,
      toggle: (value: unknown) => setSelected(toggleValue(selected, value)),
      isSelected: (value: unknown) => selected.includes(value),
      clear: () => column.setFilterValue(undefined),
    }
  }

  return { getFacet }
}

'use client'

import type { RowData, Table } from '@tanstack/react-table'
import type { ColumnFacet, FacetedFiltersReturn, RangeFacet } from '../types'
import {
  buildFacetOptions,
  facetedFilterFn,
  needsRangeFilterFn,
  normalizeSelected,
  toggleValue,
} from '../utils/facets'

/**
 * Looks up a leaf column without provoking TanStack's own existence check.
 * `table.getColumn(id)` console.errors for an unknown id whenever
 * NODE_ENV !== 'production', which would fire on every render for a consumer
 * whose facet config carries a stale column id. Only leaf columns hold values,
 * so they are the only ones that can be faceted.
 */
function findColumn<TData extends RowData>(table: Table<TData>, columnId: string) {
  return table.getAllLeafColumns().find((c) => c.id === columnId)
}

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

/** A range facet with no bounds and inert handlers. */
function emptyRangeFacet(): RangeFacet {
  return {
    min: undefined,
    max: undefined,
    value: undefined,
    setRange: () => {},
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
    const column = findColumn(table, columnId)
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

  const getRangeFacet = (columnId: string): RangeFacet => {
    const column = findColumn(table, columnId)
    if (!column || isServerTable) return emptyRangeFacet()

    // undefined when the column holds no numeric values.
    const bounds = column.getFacetedMinMaxValues()
    const current = column.getFilterValue()
    // Only report a range for a column actually configured for ranges, and
    // only when the value really is a numeric pair. columnFilters is shared
    // per-column state and getFacet writes an array of selected values to it,
    // so without both checks a categorical selection of two numbers would be
    // reported here as an applied range.
    //
    // needsRangeFilterFn alone is not enough: it returns false for ANY
    // function, so it would classify facetedFilterFn as a range handler.
    // Identity against our own exported fn is the discriminator. A caller's
    // bespoke value-list filterFn is still indistinguishable from a bespoke
    // range one — a documented limitation, not solvable without provenance on
    // the filter value itself.
    const filterFn = column.columnDef.filterFn
    const isRangeColumn =
      filterFn !== facetedFilterFn && !needsRangeFilterFn(filterFn)
    const value =
      isRangeColumn &&
      Array.isArray(current) &&
      current.length === 2 &&
      typeof current[0] === 'number' &&
      typeof current[1] === 'number'
        ? ([current[0], current[1]] as [number, number])
        : undefined

    return {
      min: bounds?.[0],
      max: bounds?.[1],
      value,
      setRange: (range) => column.setFilterValue(range ?? undefined),
      clear: () => column.setFilterValue(undefined),
    }
  }

  return { getFacet, getRangeFacet }
}

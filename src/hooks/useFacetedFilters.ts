'use client'

import { useRef } from 'react'
import type { RowData, Table } from '@tanstack/react-table'
import type { ColumnFacet, FacetedFiltersReturn, RangeFacet } from '../types'
import {
  buildFacetOptions,
  isRangeFilterFn,
  needsArrayFilterFn,
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

// This library has no @types/node dependency, so `process` is not ambiently
// typed. Bundlers (webpack, tsup, Vite) replace `process.env.NODE_ENV` at
// build time regardless; this local declaration only satisfies `tsc` for dev
// and test. Scoped to this module (the file already has imports), so it
// cannot collide with a real NodeJS.Process type if @types/node is ever added.
declare const process: { env: { NODE_ENV?: string } }

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

  // One warning per column per hook instance. Keyed by reason so a column can
  // report two distinct problems without one silencing the other. A ref, not
  // state: warning must never trigger a re-render.
  const warned = useRef<Set<string>>(new Set())

  const warnOnce = (key: string, message: string) => {
    if (process.env.NODE_ENV === 'production') return
    if (warned.current.has(key)) return
    warned.current.add(key)
    console.warn(`[tablecraft] ${message}`)
  }

  /**
   * Resolves a column for faceting. Returns undefined - and warns once - when
   * the id is unknown or the table cannot support facets at all. Shared by both
   * accessors so the two guards cannot drift apart.
   */
  const resolveColumn = (columnId: string) => {
    const column = findColumn(table, columnId)
    if (!column) {
      warnOnce(
        `unknown:${columnId}`,
        `useFacetedFilters: no column with id "${columnId}".`
      )
      return undefined
    }
    if (isServerTable) {
      warnOnce(
        `server:${columnId}`,
        `useFacetedFilters: facets for "${columnId}" need the full dataset, ` +
          `which a manualPagination table does not have. Facets are empty.`
      )
      return undefined
    }
    return column
  }

  // A plain function, not useCallback: every value below is read from the table
  // at call time, so there is nothing stale to memoize away. A deps array would
  // have to include columnFilters and would therefore change on every filter
  // change anyway, buying no referential stability.
  const getFacet = (columnId: string): ColumnFacet => {
    const column = resolveColumn(columnId)
    if (!column) return emptyFacet()

    const selected = normalizeSelected(column.getFilterValue())
    const options = buildFacetOptions(column.getFacetedUniqueValues(), selected)

    // Writing undefined rather than [] removes the filter entry. An empty
    // array matches nothing, which would blank the table - the opposite of
    // what unchecking the last box means.
    const setSelected = (next: unknown[]) => {
      if (needsArrayFilterFn(column.columnDef.filterFn)) {
        warnOnce(
          `arrayFn:${columnId}`,
          `useFacetedFilters: column "${columnId}" writes a list of values, ` +
            `so it needs filterFn: facetedFilterFn. Filtering will be wrong without it.`
        )
      }
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
    const column = resolveColumn(columnId)
    if (!column) return emptyRangeFacet()

    // undefined when the column holds no numeric values.
    const bounds = column.getFacetedMinMaxValues()
    const current = column.getFilterValue()
    // Only report a range for a column actually configured for ranges, and
    // only when the value really is a numeric pair. columnFilters is shared
    // per-column state and getFacet writes an array of selected values to it,
    // so without both checks a categorical selection of two numbers would be
    // reported here as an applied range.
    //
    // isRangeFilterFn is the single source of truth for this: a caller's
    // bespoke value-list filterFn is still indistinguishable from a bespoke
    // range one — a documented limitation, not solvable without provenance on
    // the filter value itself.
    const isRangeColumn = isRangeFilterFn(column.columnDef.filterFn)
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
      setRange: (range) => {
        if (!isRangeFilterFn(column.columnDef.filterFn)) {
          warnOnce(
            `rangeFn:${columnId}`,
            `useFacetedFilters: column "${columnId}" writes a [min, max] range, ` +
              `so it needs filterFn: 'inNumberRange'.`
          )
        }
        column.setFilterValue(range ?? undefined)
      },
      clear: () => column.setFilterValue(undefined),
    }
  }

  return { getFacet, getRangeFacet }
}

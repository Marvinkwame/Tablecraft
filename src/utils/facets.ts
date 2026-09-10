import type { FilterFn } from '@tanstack/react-table'
import type { FacetOption } from '../types'

/**
 * Values that make no sense as a facet checkbox. Note this deliberately does
 * NOT include 0 or false — those are real values a user may want to filter by.
 */
const EMPTY_FACET_VALUES: unknown[] = [null, undefined, '']

/**
 * Filter function identifiers that only ever compare a single value. Writing an
 * array filter to a column using one of these silently produces wrong rows.
 * A `filterFn` that is a function is never listed: a custom function may handle
 * arrays and this module cannot know.
 */
const SCALAR_FILTER_FNS = new Set([
  'equals',
  'weakEquals',
  'includesString',
  'includesStringSensitive',
  'equalsString',
  'inNumberRange',
])

/**
 * Deterministic ordering for facet values. Numbers compare numerically so 9
 * sorts before 10; everything else falls back to string comparison.
 */
export function compareFacetValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

/**
 * Shapes TanStack's faceted unique-values Map into sorted, selection-aware
 * options. Count descending, ties broken by value ascending so the order is
 * stable between renders.
 */
export function buildFacetOptions(
  uniqueValues: Map<unknown, number>,
  selected: unknown[]
): FacetOption[] {
  const options: FacetOption[] = []

  for (const [value, count] of uniqueValues) {
    if (EMPTY_FACET_VALUES.includes(value)) continue
    options.push({ value, count, selected: selected.includes(value) })
  }

  return options.sort(
    (a, b) => b.count - a.count || compareFacetValues(a.value, b.value)
  )
}

/**
 * Reads a column's current filter value as a list of selected values. A scalar
 * is wrapped, so a filter set directly through `setFilter` still reads back
 * correctly.
 */
export function normalizeSelected(filterValue: unknown): unknown[] {
  if (filterValue === undefined || filterValue === null) return []
  return Array.isArray(filterValue) ? [...filterValue] : [filterValue]
}

/** Adds or removes a value, returning a new array. */
export function toggleValue(selected: unknown[], value: unknown): unknown[] {
  return selected.includes(value)
    ? selected.filter((v) => v !== value)
    : [...selected, value]
}

/** True when writing an array filter to this `filterFn` would misbehave. */
export function needsArrayFilterFn(filterFn: unknown): boolean {
  if (typeof filterFn === 'function') return false
  if (filterFn === undefined || filterFn === 'auto') return true
  return typeof filterFn === 'string' && SCALAR_FILTER_FNS.has(filterFn)
}

/** True when writing a `[min, max]` filter to this `filterFn` would misbehave. */
export function needsRangeFilterFn(filterFn: unknown): boolean {
  if (typeof filterFn === 'function') return false
  return filterFn !== 'inNumberRange'
}

/**
 * True when `filterFn` is configured to receive a `[min, max]` range.
 * `needsRangeFilterFn` alone is not enough — it returns false for ANY function,
 * which would classify facetedFilterFn as a range handler. This is the single
 * source of truth for "is this a range column"; both the read path (which
 * decides whether to report a range) and the write path (which decides whether
 * to warn) must use it, or they drift.
 */
export function isRangeFilterFn(filterFn: unknown): boolean {
  return filterFn !== facetedFilterFn && !needsRangeFilterFn(filterFn)
}

/**
 * The `filterFn` a faceted column must declare. `getFacet` writes an array of
 * selected values to `columnFilters`, and this checks the cell value for
 * membership in that array by equality.
 *
 * TanStack's built-in `arrIncludesSome` looks similar but is not this:
 *
 * ```js
 * const arrIncludesSome = (row, columnId, filterValue) =>
 *   filterValue.some(val => row.getValue(columnId)?.includes(val))
 * ```
 *
 * It calls `.includes()` on the *cell value*, so it is built for a column
 * whose cell value is itself an array (a `tags` field), not for a scalar
 * column being faceted against a list of selected values. Used on a scalar
 * column it either throws (`row.getValue(columnId).includes` is not a
 * function on a number) or substring-matches (a string's `.includes` matches
 * `'Admin'` inside `'Super Admin'`). Do not swap this back for
 * `arrIncludesSome` — that is the exact bug this function exists to fix.
 */
export const facetedFilterFn: FilterFn<any> = (row, columnId, filterValue) =>
  Array.isArray(filterValue) && filterValue.includes(row.getValue(columnId))

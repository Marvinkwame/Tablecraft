import { matchSorter, rankings } from 'match-sorter'
import type { Row, RowData } from '@tanstack/react-table'
import type { TablecraftFeatures } from '../features'

/**
 * Typo-tolerant matching for `useTable`'s `fuzzy` option.
 *
 * `fuzzy: true` loads `match-sorter` with `require()`, which works in Node and
 * throws in ESM-only bundlers — Vite above all, the most common way to start a
 * React app. This is the same behaviour reached through a static import, so it
 * works everywhere.
 *
 * The `fuzzy` option already accepts `boolean | FilterFn`, so nothing about the
 * API changes; this is a function to pass to it:
 *
 * Declared generic rather than annotated `FilterFn<TablecraftFeatures, any>`:
 * `FilterFn` is `in out` in `TData`, so a fixed `any` pins `useTable`'s own
 * `TData` inference to `any` and a consumer's typed `columns` stop fitting.
 *
 * ```ts
 * import { fuzzyFilterFn } from '@marvinackerman/tablecraft/fuzzy'
 * useTable({ data, columns, fuzzy: fuzzyFilterFn })
 * ```
 */
export function fuzzyFilterFn<TData extends RowData>(
  row: Row<TablecraftFeatures, TData>,
  columnId: string,
  filterValue: unknown
): boolean {
  // A blank search matches everything rather than nothing — the same rule the
  // require()-based path applies, and the opposite of what match-sorter would
  // do with an empty needle.
  if (!filterValue || String(filterValue).trim() === '') return true

  const items = [{ value: row.getValue(columnId) }]
  return (
    matchSorter(items, String(filterValue), {
      keys: ['value'],
      threshold: rankings.MATCHES,
    }).length > 0
  )
}

fuzzyFilterFn.autoRemove = (val: unknown) => !val

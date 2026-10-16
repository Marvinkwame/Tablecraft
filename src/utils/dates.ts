import type { Row, RowData } from '@tanstack/react-table'
import type { TablecraftFeatures } from '../features'
import type { DateInput, DateRange } from '../types'

/**
 * `Date | string | number` → epoch milliseconds, or `null` when there is
 * nothing usable.
 *
 * `null` rather than `NaN` deliberately: `NaN` survives neither a JSON round
 * trip nor a comparison, so letting it into stored filter state would produce
 * a filter that silently matches nothing and cannot be restored.
 */
function toEpoch(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const ms = value instanceof Date ? value.getTime() : new Date(value as string | number).getTime()
  return Number.isNaN(ms) ? null : ms
}

/** Start of the local calendar day containing `ms`. */
function startOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** End of the local calendar day containing `ms`. */
function endOfLocalDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/**
 * Normalises a pair of dates into the shape `inDateRange` expects:
 * `[number | null, number | null]` in epoch milliseconds.
 *
 * Epoch numbers rather than `Date` objects because the result is written to
 * `columnFilters`, which is JSON-encoded for URL sync and persistence. A
 * `Date` comes back from `JSON.parse` as a string and never matches again.
 */
export function toDateRange(from: DateInput | null, to: DateInput | null): DateRange {
  return [toEpoch(from), toEpoch(to)]
}

/**
 * Filters a date column to a range, comparing **local calendar days**.
 *
 * The lower bound widens to the start of its local day and the upper bound to
 * the end of its, so a range picked as "15 March to 31 March" includes a row
 * created at 31 March 14:00. Comparing raw instants would exclude it — the
 * off-by-one every date filter is first reported for.
 *
 * Local rather than UTC because a date picker returns local midnight: in
 * UTC+2, "15 March" is 14 March 22:00Z, so reading its UTC day would start the
 * range a day early and reintroduce the same bug.
 *
 * Widening happens here rather than in `toDateRange` so the rule holds however
 * the value was set — including a consumer calling
 * `columnFilters.setFilter(id, [a, b])` directly.
 *
 * ```ts
 * createColumns<Row>([{ accessorKey: 'created', header: 'Created', filterFn: inDateRange }])
 * columnFilters.setFilter('created', toDateRange(from, to))
 * ```
 */
export function inDateRange<TData extends RowData>(
  row: Row<TablecraftFeatures, TData>,
  columnId: string,
  filterValue: unknown,
  // Declared to match FilterFn's arity so the real caller's 4-argument
  // invocation type-checks. Never used — this filter emits no meta.
  _addMeta?: (meta: never) => void
): boolean {
  const cell = toEpoch(row.getValue(columnId))
  if (cell === null) return false

  const [rawFrom, rawTo] = Array.isArray(filterValue)
    ? (filterValue as DateRange)
    : [null, null]

  if (rawFrom !== null && cell < startOfLocalDay(rawFrom)) return false
  if (rawTo !== null && cell > endOfLocalDay(rawTo)) return false
  return true
}

inDateRange.autoRemove = (val: unknown) =>
  !Array.isArray(val) || (val[0] === null && val[1] === null)

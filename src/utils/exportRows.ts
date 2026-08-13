import type { RowData, Table } from '@tanstack/react-table'
import type { UseTableExportOptions } from '../types'
import { humanizeKey } from './humanizeKey'

/**
 * Convert an exported cell value into its string form for CSV.
 *
 * Only CSV uses this — `toRows()` and `toJSON()` keep raw values so that
 * numbers stay numbers and null stays null in JSON output.
 */
export function coerceValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** RFC 4180: quote a field if it contains the delimiter, a quote, CR or LF. */
export function escapeCSVField(field: string, delimiter: string): string {
  const needsQuoting =
    field.includes(delimiter) ||
    field.includes('"') ||
    field.includes('\n') ||
    field.includes('\r')

  if (!needsQuoting) return field
  return `"${field.replace(/"/g, '""')}"`
}

export interface CSVStringOptions {
  delimiter?: string
  header?: boolean
}

/** Serialize label-keyed rows to RFC 4180 CSV. */
export function toCSVString(
  rows: Record<string, unknown>[],
  labels: string[],
  options: CSVStringOptions = {}
): string {
  const { delimiter = ',', header = true } = options
  const lines: string[] = []

  if (header) {
    lines.push(labels.map((l) => escapeCSVField(l, delimiter)).join(delimiter))
  }

  for (const row of rows) {
    lines.push(
      labels.map((l) => escapeCSVField(coerceValue(row[l]), delimiter)).join(delimiter)
    )
  }

  if (lines.length === 0) return ''
  return lines.join('\r\n') + '\r\n'
}

/**
 * A column's export label: its string header, else a humanized column id.
 * Function headers render JSX, so they cannot be used as a label.
 */
export function resolveColumnLabel(header: unknown, columnId: string): string {
  return typeof header === 'string' && header.length > 0 ? header : humanizeKey(columnId)
}

/** Suffix repeated labels ("Name", "Name (2)") so every column keeps its own key. */
export function dedupeLabels(labels: string[]): string[] {
  const seen = new Set<string>()
  return labels.map((label) => {
    let candidate = label
    let n = 2
    while (seen.has(candidate)) {
      candidate = `${label} (${n})`
      n++
    }
    seen.add(candidate)
    return candidate
  })
}

export interface ExtractedRows {
  labels: string[]
  rows: Record<string, unknown>[]
}

/**
 * Resolve the requested rows and columns into label-keyed plain objects.
 *
 * `'filtered'` reads getPrePaginationRowModel() — getFilteredRowModel() sits
 * before sorting in TanStack's pipeline and would drop the user's sort order.
 */
export function extractRows<TData extends RowData>(
  table: Table<TData>,
  options: UseTableExportOptions = {}
): ExtractedRows {
  const { rows: rowScope = 'filtered', columns: columnScope = 'visible', include, exclude } = options

  const rowModel =
    rowScope === 'page'
      ? table.getRowModel()
      : rowScope === 'selected'
        ? table.getFilteredSelectedRowModel()
        : rowScope === 'all'
          ? table.getCoreRowModel()
          : table.getPrePaginationRowModel()

  // flatRows includes sub-rows; group header rows carry no cell values.
  const dataRows = rowModel.flatRows.filter((row) => !row.getIsGrouped())

  let columns =
    columnScope === 'all' ? table.getAllLeafColumns() : table.getVisibleLeafColumns()

  // Display columns (checkboxes, action buttons) have no accessor and nothing to export.
  columns = columns.filter((column) => !!column.accessorFn)

  if (include) {
    const allowed = new Set(include)
    columns = columns.filter((column) => allowed.has(column.id))
  }
  if (exclude) {
    const denied = new Set(exclude)
    columns = columns.filter((column) => !denied.has(column.id))
  }

  const labels = dedupeLabels(
    columns.map((column) => resolveColumnLabel(column.columnDef.header, column.id))
  )

  const rows = dataRows.map((row) => {
    const out: Record<string, unknown> = {}
    columns.forEach((column, i) => {
      const exportValue = column.columnDef.meta?.exportValue
      out[labels[i]] = exportValue ? exportValue(row) : row.getValue(column.id)
    })
    return out
  })

  return { labels, rows }
}

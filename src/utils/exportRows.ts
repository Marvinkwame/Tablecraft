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

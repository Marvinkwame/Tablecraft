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

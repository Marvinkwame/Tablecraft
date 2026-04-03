import type { ColumnDef, RowData } from '@tanstack/react-table'

export interface InferColumnsOptions<TData extends RowData> {
  /** Whitelist — only include these keys as columns */
  include?: (keyof TData)[]
  /** Blacklist — exclude these keys from columns */
  exclude?: (keyof TData)[]
  /** Override specific column definitions while keeping the rest inferred */
  overrides?: Partial<Record<keyof TData, Partial<ColumnDef<TData, any>>>>
}

/**
 * Auto-generate typed column definitions from your data shape.
 * Infers depth-1 (flat) keys only. Nested objects and arrays are skipped.
 *
 * @param data - Array of data objects (needs at least one row to infer shape)
 * @param options - Include/exclude/override options
 * @returns ColumnDef<TData>[]
 */
export function inferColumns<TData extends RowData>(
  data: TData[],
  options: InferColumnsOptions<TData> = {}
): ColumnDef<TData, any>[] {
  const { include, exclude = [], overrides = {} } = options

  if (data.length === 0) return []

  const sample = data[0]
  const allKeys = Object.keys(sample as object) as (keyof TData & string)[]

  // Determine which keys to use
  let keys: (keyof TData & string)[]

  if (include && include.length > 0) {
    // Whitelist mode: only use specified keys, in the order provided
    keys = include.filter((k) => allKeys.includes(k as string as keyof TData & string)) as (keyof TData & string)[]
  } else {
    // Blacklist mode: use all keys except excluded
    keys = allKeys.filter((k) => !exclude.includes(k))
  }

  return keys
    .filter((key) => {
      // Skip depth > 1: nested objects and arrays
      const value = (sample as Record<string, unknown>)[key]
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') return false
      }
      return true
    })
    .map((key) => {
      const override = (overrides as Record<string, Partial<ColumnDef<TData, any>> | undefined>)[key] ?? {}

      // Generate a human-readable header from the key
      // "firstName" → "First Name", "created_at" → "Created At"
      const header =
        (override.header as string) ??
        String(key)
          // camelCase → spaced
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          // snake_case → spaced
          .replace(/[_-]/g, ' ')
          // capitalize each word
          .replace(/\b\w/g, (c) => c.toUpperCase())

      return {
        accessorKey: key,
        header,
        ...override,
      } as ColumnDef<TData, any>
    })
}

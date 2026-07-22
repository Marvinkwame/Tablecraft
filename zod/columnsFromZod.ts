import type { ColumnDef } from '@tanstack/react-table'
import type { z } from 'zod'
import { humanizeKey } from '../src/utils/humanizeKey'
import { getShape, requireShape } from './introspect'

export interface ColumnsFromZodOptions<TData> {
  /** Whitelist — only include these keys, in the order given */
  include?: (keyof TData)[]
  /** Blacklist — exclude these keys */
  exclude?: (keyof TData)[]
  /** Override specific column definitions while keeping the rest generated */
  overrides?: Partial<Record<keyof TData, Partial<ColumnDef<TData, any>>>>
}

/**
 * Generate headless column definitions from a Zod object schema.
 *
 * Produces `{ accessorKey, header }` per top-level field — no cell renderers,
 * no styling. Unlike `inferColumns`, this needs no sample data.
 *
 * Fields whose schema directly exposes `.shape` (a nested `z.object`) are
 * skipped. Arrays, records, and optional/nullable-wrapped objects are NOT
 * auto-detected — `.shape` is `undefined` on `z.array(...)`, `z.record(...)`,
 * and `z.object({...}).optional()` / `.nullable()`, so those fields still get
 * a column. Use `exclude` for those. Requires a plain `z.object({...})`;
 * wrapped schemas (`.refine()`) throw — use `zodValidator` for those, which
 * supports them fully.
 */
export function columnsFromZod<TSchema extends z.ZodType>(
  schema: TSchema,
  options: ColumnsFromZodOptions<z.infer<TSchema>> = {}
): ColumnDef<z.infer<TSchema>, any>[] {
  type TData = z.infer<TSchema>
  const { include, exclude = [], overrides = {} } = options

  const shape = requireShape(schema, 'columnsFromZod')

  // Skip nested object fields — a nested z.object exposes its own `.shape`.
  // Anything undetectable simply keeps its column; the caller can `exclude` it.
  const allKeys = Object.keys(shape).filter((key) => getShape(shape[key]) === null) as (keyof TData &
    string)[]

  const keys: (keyof TData & string)[] =
    include && include.length > 0
      ? (include.filter((k) => allKeys.includes(k as keyof TData & string)) as (keyof TData & string)[])
      : allKeys.filter((k) => !exclude.includes(k))

  return keys.map((key) => {
    const override =
      (overrides as Record<string, Partial<ColumnDef<TData, any>> | undefined>)[key] ?? {}
    const header = (override.header as string) ?? humanizeKey(String(key))
    return { accessorKey: key, header, ...override } as ColumnDef<TData, any>
  })
}

import type { ColumnDef, RowData } from '@tanstack/react-table'

/**
 * Type-safe column definition helper. Returns a stable `ColumnDef<TData>[]`
 * without needing `useMemo` or manual type annotations.
 */
export function createColumns<TData extends RowData>(
  columns: ColumnDef<TData, any>[]
): ColumnDef<TData, any>[] {
  return columns
}

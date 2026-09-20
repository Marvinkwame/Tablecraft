import type { ColumnDef, RowData } from '@tanstack/react-table'
import type { TablecraftFeatures } from '../features'

/**
 * Type-safe column definition helper. Returns a stable
 * `ColumnDef<TablecraftFeatures, TData, any>[]` without needing `useMemo` or
 * manual type annotations.
 */
export function createColumns<TData extends RowData>(
  defs: ColumnDef<TablecraftFeatures, TData, any>[]
): ColumnDef<TablecraftFeatures, TData, any>[] {
  return defs
}

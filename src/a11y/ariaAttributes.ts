import type { Row, RowData, SortingState } from '@tanstack/react-table'
import type { TablecraftFeatures, TablecraftTable } from '../features'

/**
 * Returns the aria-sort value for a header cell.
 * 'none' when the column is not currently sorted.
 */
export function getAriaSortValue(
  headerId: string,
  sorting: SortingState
): 'ascending' | 'descending' | 'none' {
  const entry = sorting.find((s) => s.id === headerId)
  if (!entry) return 'none'
  return entry.desc ? 'descending' : 'ascending'
}

/**
 * Total number of filtered rows — used for aria-rowcount.
 */
export function getAriaRowCount<TData extends RowData>(table: TablecraftTable<TData>): number {
  return table.getFilteredRowModel().rows.length
}

/**
 * Number of visible leaf columns — used for aria-colcount.
 */
export function getAriaColCount<TData extends RowData>(table: TablecraftTable<TData>): number {
  return table.getVisibleLeafColumns().length
}

/**
 * 1-based row index of the given rowId within the provided rows array.
 * Returns -1 if the row is not found (should not happen in normal usage).
 */
export function getAriaRowIndex<TData extends RowData>(
  rowId: string,
  rows: Row<TablecraftFeatures, TData>[]
): number {
  const idx = rows.findIndex((r) => r.id === rowId)
  return idx === -1 ? -1 : idx + 1
}

'use client'

import type { RowData } from '@tanstack/react-table'
import type { UseServerTableOptions, UseTableReturn } from '../types'
import { useTable } from './useTable'

/**
 * Server-side table variant. Forces `manualPagination` and `manualSorting` to true.
 * Use this when your backend handles sorting, pagination, and filtering.
 */
export function useServerTable<TData extends RowData>(
  options: UseServerTableOptions<TData>
): UseTableReturn<TData> {
  return useTable({
    ...options,
    manualPagination: true,
    manualSorting: true,
  })
}

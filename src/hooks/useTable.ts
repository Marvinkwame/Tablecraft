'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'

import type {
  UseTableOptions,
  UseTableReturn,
  PaginationReturn,
  SortingReturn,
  GlobalFilterReturn,
  ColumnFiltersReturn,
} from '../types'
import { usePaginationState } from './usePaginationState'
import { useSortState } from './useSortState'
import { useFilterState } from './useFilterState'
import { useColumnFilterState } from './useColumnFilterState'

export function useTable<TData extends RowData>(
  options: UseTableOptions<TData>
): UseTableReturn<TData> {
  const {
    data,
    columns,
    pagination: paginationOpts = true,
    sorting: sortingOpts = true,
    globalFilter: globalFilterEnabled = true,
    columnFilters: columnFiltersEnabled = true,
    manualPagination = false,
    manualSorting = false,
    rowCount,
    onPaginationChange: externalOnPaginationChange,
    onSortingChange: externalOnSortingChange,
    onGlobalFilterChange: externalOnGlobalFilterChange,
    onColumnFiltersChange: externalOnColumnFiltersChange,
  } = options

  // Resolve pagination options
  const paginationConfig =
    typeof paginationOpts === 'object'
      ? paginationOpts
      : paginationOpts
        ? {}
        : { pageSize: data.length || 1 }

  // Resolve sorting options
  const sortingConfig =
    typeof sortingOpts === 'object' ? sortingOpts : {}

  // Internal state
  const paginationState = usePaginationState(paginationConfig)
  const sortState = useSortState(sortingConfig)
  const filterState = useFilterState()
  const columnFilterState = useColumnFilterState()

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: paginationState.state,
      sorting: sortState.state,
      globalFilter: filterState.state,
      columnFilters: columnFilterState.state,
    },

    // Pagination
    onPaginationChange: externalOnPaginationChange ?? paginationState.onPaginationChange,
    manualPagination,
    rowCount,
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),

    // Sorting
    onSortingChange: externalOnSortingChange ?? sortState.onSortingChange,
    manualSorting,
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),

    // Filters
    onGlobalFilterChange: externalOnGlobalFilterChange ?? filterState.onGlobalFilterChange,
    onColumnFiltersChange: externalOnColumnFiltersChange ?? columnFilterState.onColumnFiltersChange,
    getFilteredRowModel:
      globalFilterEnabled || columnFiltersEnabled ? getFilteredRowModel() : undefined,

    getCoreRowModel: getCoreRowModel(),
  })

  // Build pagination return
  const pagination: PaginationReturn = useMemo(
    () => ({
      pageIndex: paginationState.state.pageIndex,
      pageSize: paginationState.state.pageSize,
      pageCount: table.getPageCount(),
      canPreviousPage: table.getCanPreviousPage(),
      canNextPage: table.getCanNextPage(),
      previousPage: () => table.previousPage(),
      nextPage: () => table.nextPage(),
      setPageIndex: paginationState.setPageIndex,
      setPageSize: paginationState.setPageSize,
    }),
    [paginationState.state, table, paginationState.setPageIndex, paginationState.setPageSize]
  )

  // Build sorting return
  const sorting: SortingReturn = useMemo(
    () => ({
      sortingState: sortState.state,
      setSorting: sortState.onSortingChange,
      clearSorting: sortState.clearSorting,
    }),
    [sortState.state, sortState.onSortingChange, sortState.clearSorting]
  )

  // Build global filter return
  const globalFilter: GlobalFilterReturn = useMemo(
    () => ({
      value: filterState.state,
      setValue: filterState.onGlobalFilterChange,
      clear: filterState.clear,
    }),
    [filterState.state, filterState.onGlobalFilterChange, filterState.clear]
  )

  // Build column filters return
  const columnFiltersReturn: ColumnFiltersReturn = useMemo(
    () => ({
      state: columnFilterState.state,
      setFilter: columnFilterState.setFilter,
      clearFilter: columnFilterState.clearFilter,
      clearAll: columnFilterState.clearAll,
    }),
    [columnFilterState.state, columnFilterState.setFilter, columnFilterState.clearFilter, columnFilterState.clearAll]
  )

  return {
    table,
    pagination,
    sorting,
    globalFilter,
    columnFilters: columnFiltersReturn,
  }
}

'use client'

/* eslint-disable @typescript-eslint/no-require-imports */
declare const require: (id: string) => any

import { useMemo, useEffect, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import type { FilterFn, RowData } from '@tanstack/react-table'

import type {
  UseTableOptions,
  UseTableReturn,
  PaginationReturn,
  SortingReturn,
  GlobalFilterReturn,
  ColumnFiltersReturn,
  EmptyStateReturn,
} from '../types'
import { usePaginationState } from './usePaginationState'
import { useSortState } from './useSortState'
import { useFilterState } from './useFilterState'
import { useColumnFilterState } from './useColumnFilterState'
import { loadPersistedState, savePersistedState } from '../utils/persist'

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
    fuzzy = false,
    persist = false,
    persistKey,
    persistOptions,
  } = options

  // ─── Persistence: load initial state ─────────────────────
  const persistedRef = useRef(
    persist && persistKey
      ? loadPersistedState(persist, persistKey, persistOptions)
      : {}
  )
  const persisted = persistedRef.current

  // ─── Resolve pagination options ──────────────────────────
  const paginationConfig =
    typeof paginationOpts === 'object'
      ? paginationOpts
      : paginationOpts
        ? {}
        : { pageSize: data.length || 1 }

  // Apply persisted pagination if available
  if (persisted.pagination) {
    paginationConfig.pageIndex = paginationConfig.pageIndex ?? persisted.pagination.pageIndex
    paginationConfig.pageSize = paginationConfig.pageSize ?? persisted.pagination.pageSize
  }

  // ─── Resolve sorting options ─────────────────────────────
  const sortingConfig =
    typeof sortingOpts === 'object' ? sortingOpts : {}

  // Apply persisted sorting if available
  if (persisted.sorting && !sortingConfig.defaultSort) {
    sortingConfig.defaultSort = persisted.sorting
  }

  // ─── Internal state ──────────────────────────────────────
  const paginationState = usePaginationState(paginationConfig)
  const sortState = useSortState(sortingConfig)
  const filterState = useFilterState(persisted.globalFilter ?? '')
  const columnFilterState = useColumnFilterState()

  // ─── Fuzzy filter ────────────────────────────────────────
  const fuzzyFilterFn = useMemo<FilterFn<TData> | undefined>(() => {
    if (!fuzzy) return undefined
    try {
      const matchSorterLib = require('match-sorter')
      const matchSorter: typeof import('match-sorter').matchSorter =
        matchSorterLib.matchSorter
      const rankings = matchSorterLib.rankings

      const fn: FilterFn<TData> = (row, columnId, filterValue) => {
        if (!filterValue || String(filterValue).trim() === '') return true
        const cellValue = row.getValue(columnId)
        const items = [{ value: cellValue }]
        const result = matchSorter(items, String(filterValue), {
          keys: ['value'],
          threshold: rankings.MATCHES,
        })
        return result.length > 0
      }
      fn.autoRemove = (val: unknown) => !val
      return fn
    } catch {
      console.warn(
        '[tablecraft] fuzzy: true requires "match-sorter" as a peer dependency. ' +
        'Install it with: npm install match-sorter'
      )
      return undefined
    }
  }, [fuzzy])

  // ─── Build table ─────────────────────────────────────────
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
    globalFilterFn: fuzzyFilterFn ?? 'includesString',

    getCoreRowModel: getCoreRowModel(),
  })

  // ─── Persistence: save state on change ───────────────────
  useEffect(() => {
    if (!persist || !persistKey) return

    savePersistedState(persist, persistKey, {
      sorting: sortState.state,
      columnFilters: columnFilterState.state,
      globalFilter: filterState.state,
      pagination: paginationState.state,
    }, persistOptions)
  }, [
    persist,
    persistKey,
    persistOptions,
    sortState.state,
    columnFilterState.state,
    filterState.state,
    paginationState.state,
  ])

  // ─── Build pagination return ─────────────────────────────
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

  // ─── Build sorting return ────────────────────────────────
  const sorting: SortingReturn = useMemo(
    () => ({
      sortingState: sortState.state,
      setSorting: sortState.onSortingChange,
      clearSorting: sortState.clearSorting,
    }),
    [sortState.state, sortState.onSortingChange, sortState.clearSorting]
  )

  // ─── Build global filter return ──────────────────────────
  const globalFilter: GlobalFilterReturn = useMemo(
    () => ({
      value: filterState.state,
      setValue: filterState.onGlobalFilterChange,
      clear: filterState.clear,
    }),
    [filterState.state, filterState.onGlobalFilterChange, filterState.clear]
  )

  // ─── Build column filters return ─────────────────────────
  const columnFiltersReturn: ColumnFiltersReturn = useMemo(
    () => ({
      state: columnFilterState.state,
      setFilter: columnFilterState.setFilter,
      clearFilter: columnFilterState.clearFilter,
      clearAll: columnFilterState.clearAll,
    }),
    [columnFilterState.state, columnFilterState.setFilter, columnFilterState.clearFilter, columnFilterState.clearAll]
  )

  // ─── Build empty state return ────────────────────────────
  const emptyState: EmptyStateReturn = useMemo(
    () => ({
      isEmpty: data.length === 0,
      isFilteredEmpty:
        data.length > 0 && table.getRowModel().rows.length === 0,
    }),
    [data.length, table.getRowModel().rows.length]
  )

  return {
    table,
    pagination,
    sorting,
    globalFilter,
    columnFilters: columnFiltersReturn,
    emptyState,
  }
}

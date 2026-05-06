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
  getExpandedRowModel,
  getGroupedRowModel,
} from '@tanstack/react-table'
import type { FilterFn, RowData } from '@tanstack/react-table'

import type {
  UseTableOptions,
  UseTableReturn,
  PaginationReturn,
  SortingReturn,
  GlobalFilterReturn,
  ColumnFiltersReturn,
  RowSelectionReturn,
  ColumnVisibilityReturn,
  RowExpansionReturn,
  GroupingReturn,
  ColumnPinningReturn,
  EmptyStateReturn,
} from '../types'
import { usePaginationState } from './usePaginationState'
import { useSortState } from './useSortState'
import { useFilterState } from './useFilterState'
import { useColumnFilterState } from './useColumnFilterState'
import { useRowSelectionState } from './useRowSelectionState'
import { useColumnVisibilityState } from './useColumnVisibilityState'
import { useRowExpansionState } from './useRowExpansionState'
import { useGroupingState } from './useGroupingState'
import { useColumnPinningState } from './useColumnPinningState'
import { useTableKitDefaults } from '../context/TableKitContext'
import { loadPersistedState, savePersistedState } from '../utils/persist'
import { parseURLState, writeURLState, resolveURLKeys } from '../utils/url'

export function useTable<TData extends RowData>(
  options: UseTableOptions<TData>
): UseTableReturn<TData> {
  // ─── Merge provider defaults with per-call options ──────
  const providerDefaults = useTableKitDefaults()

  const merged = {
    fuzzy: providerDefaults.fuzzy,
    rowSelection: providerDefaults.rowSelection,
    columnVisibility: providerDefaults.columnVisibility,
    rowExpansion: providerDefaults.rowExpansion,
    grouping: providerDefaults.grouping,
    columnPinning: providerDefaults.columnPinning,
    globalFilter: providerDefaults.globalFilter,
    columnFilters: providerDefaults.columnFilters,
    persist: providerDefaults.persist,
    persistOptions: providerDefaults.persistOptions,
    syncUrl: providerDefaults.syncUrl,
    ...options,
  } as UseTableOptions<TData>

  // Resolve provider pageSize shortcut
  if (providerDefaults.pageSize && !('pagination' in options)) {
    merged.pagination = { pageSize: providerDefaults.pageSize }
  } else if (providerDefaults.pageSize && options.pagination === true) {
    merged.pagination = { pageSize: providerDefaults.pageSize }
  }

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
    rowSelection: rowSelectionOpts = false,
    columnVisibility: columnVisibilityOpts = false,
    rowExpansion: rowExpansionOpts = false,
    grouping: groupingOpts = false,
    columnPinning: columnPinningOpts = false,
    fuzzy = false,
    persist = false,
    persistKey,
    persistOptions,
    syncUrl = false,
  } = merged

  // ─── Persistence: load initial state ─────────────────────
  const persistedRef = useRef(
    persist && persistKey
      ? loadPersistedState(persist, persistKey, persistOptions)
      : {}
  )
  const persisted = persistedRef.current

  // ─── URL sync: load initial state (priority: URL > persist) ──
  const urlSyncEnabled = !!syncUrl
  const urlConfig = typeof syncUrl === 'object' ? syncUrl : {}
  const urlKeys = resolveURLKeys(urlConfig.keys)
  const urlMode = urlConfig.mode ?? 'replace'

  const urlStateRef = useRef(
    urlSyncEnabled ? parseURLState(urlKeys) : {}
  )
  const urlState = urlStateRef.current

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

  // URL overrides persist
  if (urlState.pagination) {
    paginationConfig.pageIndex = urlState.pagination.pageIndex
    paginationConfig.pageSize = urlState.pagination.pageSize
  }

  // ─── Resolve sorting options ─────────────────────────────
  const sortingConfig =
    typeof sortingOpts === 'object' ? sortingOpts : {}

  // Apply persisted sorting if available
  if (persisted.sorting && !sortingConfig.defaultSort) {
    sortingConfig.defaultSort = persisted.sorting
  }

  // URL overrides persist
  if (urlState.sorting) {
    sortingConfig.defaultSort = urlState.sorting
  }

  // ─── Resolve initial filter values ───────────────────────
  const initialGlobalFilter = urlState.globalFilter ?? persisted.globalFilter ?? ''
  const initialColumnFilters = urlState.columnFilters ?? persisted.columnFilters ?? []

  // ─── Internal state ──────────────────────────────────────
  const paginationState = usePaginationState(paginationConfig)
  const sortState = useSortState(sortingConfig)
  const filterState = useFilterState(initialGlobalFilter)
  const columnFilterState = useColumnFilterState(initialColumnFilters)

  // ─── Row selection ───────────────────────────────────────
  const rowSelectionEnabled = !!rowSelectionOpts
  const rowSelectionConfig =
    typeof rowSelectionOpts === 'object' ? rowSelectionOpts : {}
  const rowSelectionState = useRowSelectionState(rowSelectionConfig)

  // ─── Column visibility ──────────────────────────────────
  const columnVisibilityEnabled = !!columnVisibilityOpts
  const columnVisibilityConfig =
    typeof columnVisibilityOpts === 'object' ? columnVisibilityOpts : {}
  const columnVisibilityState = useColumnVisibilityState(columnVisibilityConfig)

  // ─── Row expansion ──────────────────────────────────────
  const rowExpansionEnabled = !!rowExpansionOpts
  const rowExpansionConfig =
    typeof rowExpansionOpts === 'object' ? rowExpansionOpts : {}
  const rowExpansionState = useRowExpansionState(rowExpansionConfig)

  // ─── Grouping ────────────────────────────────────────────
  const groupingEnabled = !!groupingOpts
  const groupingConfig =
    typeof groupingOpts === 'object' ? groupingOpts : {}
  const groupingState = useGroupingState(groupingConfig)

  // ─── Column pinning ──────────────────────────────────────
  const columnPinningEnabled = !!columnPinningOpts
  const columnPinningConfig =
    typeof columnPinningOpts === 'object' ? columnPinningOpts : {}
  const columnPinningState = useColumnPinningState(columnPinningConfig)

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
      ...(rowSelectionEnabled && { rowSelection: rowSelectionState.state }),
      ...(columnVisibilityEnabled && { columnVisibility: columnVisibilityState.state }),
      ...(rowExpansionEnabled && { expanded: rowExpansionState.state }),
      ...(groupingEnabled && { grouping: groupingState.state }),
      ...(columnPinningEnabled && { columnPinning: columnPinningState.state }),
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

    // Row selection
    ...(rowSelectionEnabled && {
      onRowSelectionChange: rowSelectionState.onRowSelectionChange,
      enableMultiRowSelection: rowSelectionState.enableMultiRowSelection,
    }),

    // Column visibility
    ...(columnVisibilityEnabled && {
      onColumnVisibilityChange: columnVisibilityState.onColumnVisibilityChange,
    }),

    // Row expansion
    ...(rowExpansionEnabled && {
      onExpandedChange: rowExpansionState.onExpandedChange,
      getExpandedRowModel: getExpandedRowModel(),
      paginateExpandedRows: rowExpansionConfig.paginateExpandedRows,
    }),
    ...(rowExpansionEnabled && rowExpansionConfig.getSubRows && {
      getSubRows: rowExpansionConfig.getSubRows,
    }),

    // Grouping
    ...(groupingEnabled && {
      onGroupingChange: groupingState.onGroupingChange,
      getGroupedRowModel: getGroupedRowModel(),
      manualGrouping: groupingConfig.manualGrouping,
      groupedColumnMode: groupingConfig.groupedColumnMode,
    }),

    // Column pinning
    ...(columnPinningEnabled && {
      onColumnPinningChange: columnPinningState.setState,
    }),

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

  // ─── URL sync: write state on change ─────────────────────
  useEffect(() => {
    if (!urlSyncEnabled) return

    writeURLState({
      sorting: sortState.state,
      columnFilters: columnFilterState.state,
      globalFilter: filterState.state,
      pagination: paginationState.state,
    }, urlKeys, urlMode)
  }, [
    urlSyncEnabled,
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

  // ─── Build row selection return ──────────────────────────
  const allRowIds = useMemo(
    () => table.getRowModel().rows.map((r) => r.id),
    [table.getRowModel().rows]
  )

  const rowSelection: RowSelectionReturn = useMemo(
    () => ({
      state: rowSelectionState.state,
      toggleRow: rowSelectionState.toggleRow,
      toggleAll: () => rowSelectionState.toggleAll(allRowIds),
      clearSelection: rowSelectionState.clearSelection,
      selectedRowIds: rowSelectionState.selectedRowIds,
      selectedCount: rowSelectionState.selectedCount,
      isSelected: rowSelectionState.isSelected,
    }),
    [rowSelectionState, allRowIds]
  )

  // ─── Build column visibility return ─────────────────────
  const columnVisibility: ColumnVisibilityReturn = useMemo(
    () => ({
      state: columnVisibilityState.state,
      toggleColumn: columnVisibilityState.toggleColumn,
      showColumn: columnVisibilityState.showColumn,
      hideColumn: columnVisibilityState.hideColumn,
      showAll: columnVisibilityState.showAll,
      hiddenColumns: columnVisibilityState.hiddenColumns,
    }),
    [columnVisibilityState]
  )

  // ─── Build grouping return ───────────────────────────────
  const grouping: GroupingReturn = useMemo(
    () => ({
      state: groupingState.state,
      toggleGrouping: groupingState.toggleGrouping,
      setGrouping: groupingState.setGrouping,
      clearGrouping: groupingState.clearGrouping,
      isGrouped: groupingState.isGrouped,
      groupedColumns: groupingState.groupedColumns,
    }),
    [groupingState]
  )

  // ─── Build row expansion return ──────────────────────────
  const rowExpansion: RowExpansionReturn = useMemo(
    () => ({
      state: rowExpansionState.state,
      toggleRow: rowExpansionState.toggleRow,
      expandRow: rowExpansionState.expandRow,
      collapseRow: rowExpansionState.collapseRow,
      clearExpansion: rowExpansionState.clearExpansion,
      expandedRowIds: rowExpansionState.expandedRowIds,
      isExpanded: rowExpansionState.isExpanded,
    }),
    [rowExpansionState]
  )

  // ─── Build column pinning return ─────────────────────────
  const columnPinning: ColumnPinningReturn = useMemo(
    () => ({
      state: columnPinningState.state,
      pinLeft: columnPinningState.pinLeft,
      pinRight: columnPinningState.pinRight,
      unpin: columnPinningState.unpin,
      clearPinning: columnPinningState.clearPinning,
      isPinned: columnPinningState.isPinned,
      leftColumns: columnPinningState.leftColumns,
      rightColumns: columnPinningState.rightColumns,
    }),
    [columnPinningState]
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
    rowSelection,
    columnVisibility,
    rowExpansion,
    grouping,
    columnPinning,
    emptyState,
  }
}

'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
} from '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table'
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'

import type {
  SortingReturn,
  GlobalFilterReturn,
  ColumnFiltersReturn,
  RowSelectionReturn,
  ColumnVisibilityReturn,
  GroupingReturn,
  ColumnPinningReturn,
  EmptyStateReturn,
} from '../types'
import type {
  UseInfiniteTableOptions,
  UseInfiniteTableReturn,
  InfiniteTableResult,
} from '../types/query'
import { useSortState } from './useSortState'
import { useFilterState } from './useFilterState'
import { useColumnFilterState } from './useColumnFilterState'
import { useRowSelectionState } from './useRowSelectionState'
import { useColumnVisibilityState } from './useColumnVisibilityState'
import { useGroupingState } from './useGroupingState'
import { useColumnPinningState } from './useColumnPinningState'

// ─── Hook ──────────────────────────────────────────────────

export function useInfiniteTable<TData extends RowData, TCursor = unknown>(
  options: UseInfiniteTableOptions<TData, TCursor>
): UseInfiniteTableReturn<TData> {
  const {
    queryKey,
    queryFn,
    staleTime,
    gcTime,
    enabled,
    initialPageParam = 0,
    columns,
    sorting: sortingOpts = true,
    globalFilter: globalFilterEnabled = true,
    columnFilters: columnFiltersEnabled = true,
    rowSelection: rowSelectionOpts = false,
    columnVisibility: columnVisibilityOpts = false,
    grouping: groupingOpts = false,
    columnPinning: columnPinningOpts = false,
  } = options

  // ─── Resolve feature configs ─────────────────────────────
  const sortingConfig = typeof sortingOpts === 'object' ? sortingOpts : {}
  const rowSelectionEnabled = !!rowSelectionOpts
  const rowSelectionConfig = typeof rowSelectionOpts === 'object' ? rowSelectionOpts : {}
  const columnVisibilityEnabled = !!columnVisibilityOpts
  const columnVisibilityConfig = typeof columnVisibilityOpts === 'object' ? columnVisibilityOpts : {}
  const groupingEnabled = !!groupingOpts
  const groupingConfig = typeof groupingOpts === 'object' ? groupingOpts : {}
  // ─── Column pinning ──────────────────────────────────────
  const columnPinningEnabled = !!columnPinningOpts
  const columnPinningConfig = typeof columnPinningOpts === 'object' ? columnPinningOpts : {}

  // ─── Internal state hooks ────────────────────────────────
  const sortState = useSortState(sortingConfig)
  const filterState = useFilterState()
  const columnFilterState = useColumnFilterState()
  const rowSelectionState = useRowSelectionState(rowSelectionConfig)
  const columnVisibilityState = useColumnVisibilityState(columnVisibilityConfig)
  const groupingState = useGroupingState(groupingConfig)
  const columnPinningState = useColumnPinningState(columnPinningConfig)

  // ─── Compose query key ───────────────────────────────────
  // State in the key resets to initialPageParam automatically
  // when sort/filter changes — new cache key = fresh infinite query.
  const composedQueryKey = useMemo(
    () => [
      ...queryKey,
      {
        sorting: sortState.state,
        columnFilters: columnFilterState.state,
        globalFilter: filterState.state,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryKey, sortState.state, columnFilterState.state, filterState.state]
  )

  // ─── Build query options ──────────────────────────────────
  const infiniteQueryOpts: Record<string, unknown> = {
    queryKey: composedQueryKey,
    queryFn: ({ pageParam }: { pageParam: TCursor }) =>
      queryFn({
        pageParam,
        sorting: sortState.state,
        columnFilters: columnFilterState.state,
        globalFilter: filterState.state,
        grouping: groupingState.state,
      }),
    initialPageParam,
    getNextPageParam: (lastPage: InfiniteTableResult<TData, TCursor>) =>
      lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  }

  if (staleTime !== undefined) infiniteQueryOpts.staleTime = staleTime
  if (gcTime !== undefined) infiniteQueryOpts.gcTime = gcTime
  if (enabled !== undefined) infiniteQueryOpts.enabled = enabled

  const queryResult = useInfiniteQuery(infiniteQueryOpts as any) as {
    data: { pages: InfiniteTableResult<TData, TCursor>[] } | undefined
    isLoading: boolean
    isError: boolean
    isFetchingNextPage: boolean
    hasNextPage: boolean
    error: Error | null
    refetch: () => Promise<unknown>
    fetchNextPage: () => Promise<unknown>
  }

  // ─── Flatten pages into a single array ───────────────────
  const flatData = useMemo(
    () => queryResult.data?.pages.flatMap((page) => page.data) ?? [],
    [queryResult.data]
  )

  // ─── Build table ──────────────────────────────────────────
  const table = useReactTable({
    data: flatData,
    columns,
    manualSorting: true,
    state: {
      sorting: sortState.state,
      globalFilter: filterState.state,
      columnFilters: columnFilterState.state,
      ...(rowSelectionEnabled && { rowSelection: rowSelectionState.state }),
      ...(columnVisibilityEnabled && { columnVisibility: columnVisibilityState.state }),
      ...(groupingEnabled && { grouping: groupingState.state }),
      ...(columnPinningEnabled && { columnPinning: columnPinningState.state }),
    },
    onSortingChange: sortState.onSortingChange,
    onGlobalFilterChange: filterState.onGlobalFilterChange,
    onColumnFiltersChange: columnFilterState.onColumnFiltersChange,
    ...(globalFilterEnabled || columnFiltersEnabled
      ? { getFilteredRowModel: getFilteredRowModel() }
      : {}),
    globalFilterFn: 'includesString',
    ...(rowSelectionEnabled && {
      onRowSelectionChange: rowSelectionState.onRowSelectionChange,
      enableMultiRowSelection: rowSelectionState.enableMultiRowSelection,
    }),
    ...(columnVisibilityEnabled && {
      onColumnVisibilityChange: columnVisibilityState.onColumnVisibilityChange,
    }),
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

  // ─── Build named return objects ───────────────────────────

  const sorting: SortingReturn = useMemo(
    () => ({
      sortingState: sortState.state,
      setSorting: sortState.onSortingChange,
      clearSorting: sortState.clearSorting,
    }),
    [sortState.state, sortState.onSortingChange, sortState.clearSorting]
  )

  const globalFilter: GlobalFilterReturn = useMemo(
    () => ({
      value: filterState.state,
      setValue: filterState.onGlobalFilterChange,
      clear: filterState.clear,
    }),
    [filterState.state, filterState.onGlobalFilterChange, filterState.clear]
  )

  const columnFilters: ColumnFiltersReturn = useMemo(
    () => ({
      state: columnFilterState.state,
      setFilter: columnFilterState.setFilter,
      clearFilter: columnFilterState.clearFilter,
      clearAll: columnFilterState.clearAll,
    }),
    [
      columnFilterState.state,
      columnFilterState.setFilter,
      columnFilterState.clearFilter,
      columnFilterState.clearAll,
    ]
  )

  const allRowIds = useMemo(
    () => table.getRowModel().rows.map((r) => r.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const emptyState: EmptyStateReturn = useMemo(
    () => ({
      isEmpty:
        !queryResult.isLoading &&
        flatData.length === 0 &&
        filterState.state === '' &&
        columnFilterState.state.length === 0,
      isFilteredEmpty:
        !queryResult.isLoading &&
        flatData.length === 0 &&
        (filterState.state !== '' || columnFilterState.state.length > 0),
    }),
    [
      queryResult.isLoading,
      flatData.length,
      filterState.state,
      columnFilterState.state.length,
    ]
  )

  return {
    table,
    sorting,
    globalFilter,
    columnFilters,
    rowSelection,
    columnVisibility,
    grouping,
    columnPinning,
    emptyState,
    loadMore: () => { queryResult.fetchNextPage() },
    hasNextPage: queryResult.hasNextPage,
    isFetchingNextPage: queryResult.isFetchingNextPage,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error ?? null,
    refetch: () => { queryResult.refetch() },
  }
}

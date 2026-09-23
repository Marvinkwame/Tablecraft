import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import * as tablecraft from '../src/index'
import { tablecraftFeatures } from '../src/features'
import { filterFns, sortFns, aggregationFns, columnResizingFeature } from '@tanstack/react-table'
import { useTable } from '../src/hooks/useTable'
import { useTableA11y } from '../src/hooks/useTableA11y'
import { createColumns } from '../src/helpers/createColumns'
import type { TablecraftTable } from '../src/features'

type Row = { id: number; name: string }

describe('tablecraftFeatures', () => {
  it('registers every feature tablecraft wraps', () => {
    const keys = Object.keys(tablecraftFeatures)

    for (const feature of [
      'columnFilteringFeature',
      'globalFilteringFeature',
      'rowSortingFeature',
      'rowPaginationFeature',
      'rowSelectionFeature',
      'columnGroupingFeature',
      'rowExpandingFeature',
      'columnPinningFeature',
      'columnVisibilityFeature',
      'columnFacetingFeature',
    ]) {
      expect(keys).toContain(feature)
    }
  })

  it('registers every row model tablecraft relies on', () => {
    const keys = Object.keys(tablecraftFeatures)

    for (const slot of [
      'filteredRowModel',
      'sortedRowModel',
      'paginatedRowModel',
      'groupedRowModel',
      'expandedRowModel',
      'facetedRowModel',
      'facetedUniqueValues',
      'facetedMinMaxValues',
    ]) {
      expect(keys).toContain(slot)
    }
  })

  it('registers the FULL filter, sort and aggregation registries, not a subset', () => {
    // A slot's keys are the only valid string names in a column definition,
    // and tablecraft's consumers write their own columns. Under v8 every
    // built-in name resolved, so narrowing these would silently break anyone
    // using filterFn: 'equalsString' or sortingFn: 'datetime'.
    //
    // Identity assertions, deliberately: checking a handful of keys with
    // toContain would pass against a hand-picked subset containing exactly
    // those keys — which is the regression this test exists to catch.
    expect(tablecraftFeatures.filterFns).toBe(filterFns)
    expect(tablecraftFeatures.sortFns).toBe(sortFns)
    expect(tablecraftFeatures.aggregationFns).toBe(aggregationFns)
  })

  it('registers columnResizingFeature so drag-to-resize is available', () => {
    // Identity, not membership: a key could exist holding the wrong feature.
    expect(tablecraftFeatures.columnResizingFeature).toBe(columnResizingFeature)
  })
})

describe('TablecraftTable', () => {
  it('types a table built by useTable, with one type argument', () => {
    const columns = createColumns<Row>([{ accessorKey: 'name', header: 'Name' }])
    const { result } = renderHook(() =>
      useTable({ data: [{ id: 1, name: 'Ada' }], columns })
    )

    // The point of the alias: consumers write one parameter, as in v8.
    const table: TablecraftTable<Row> = result.current.table

    expect(table.getRowModel().rows).toHaveLength(1)
  })
})

describe('v9 state access', () => {
  it('reads sorting through table.store.state, which replaced getState()', () => {
    const columns = createColumns<Row>([{ accessorKey: 'name', header: 'Name' }])
    const { result } = renderHook(() => {
      const t = useTable({ data: [{ id: 1, name: 'Ada' }], columns, sorting: true })
      return { ...t, a11y: useTableA11y(t.table) }
    })

    act(() => result.current.sorting.setSorting([{ id: 'name', desc: true }]))

    const header = result.current.table.getFlatHeaders().find((h) => h.id === 'name')!
    expect(result.current.a11y.getHeaderProps(header.id)['aria-sort']).toBe('descending')
  })
})

describe('root entry', () => {
  it('exports the feature set for consumers building their own tables', () => {
    expect(tablecraft.tablecraftFeatures).toBe(tablecraftFeatures)
  })
})

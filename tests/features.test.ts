import { describe, it, expect } from 'vitest'
import { tablecraftFeatures } from '../src/features'
import { filterFns, sortFns, aggregationFns } from '@tanstack/react-table'

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
})

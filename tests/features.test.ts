import { describe, it, expect } from 'vitest'
import { tablecraftFeatures } from '../src/features'

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

  it('registers the full filter and sort registries, not a subset', () => {
    // A slot's keys are the only valid string names in column defs. A subset
    // would silently break consumers using e.g. filterFn: 'equalsString'.
    const filterFns = tablecraftFeatures.filterFns as Record<string, unknown>
    const sortFns = tablecraftFeatures.sortFns as Record<string, unknown>

    expect(Object.keys(filterFns)).toContain('includesString')
    expect(Object.keys(filterFns)).toContain('equalsString')
    expect(Object.keys(filterFns)).toContain('inNumberRange')
    expect(Object.keys(filterFns)).toContain('arrIncludesSome')
    expect(Object.keys(sortFns)).toContain('alphanumeric')
    expect(Object.keys(sortFns)).toContain('datetime')
  })
})

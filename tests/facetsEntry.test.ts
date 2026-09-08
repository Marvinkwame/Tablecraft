import { describe, it, expect } from 'vitest'
import * as tablecraft from '../src/index'
import { facetedFilterFn } from '../src/utils/facets'

describe('root entry', () => {
  it('exports useFacetedFilters', () => {
    expect(typeof tablecraft.useFacetedFilters).toBe('function')
  })

  it('exports facetedFilterFn as the same function object as src/utils/facets', () => {
    expect(tablecraft.facetedFilterFn).toBe(facetedFilterFn)
  })
})

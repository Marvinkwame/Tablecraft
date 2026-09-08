import { describe, it, expect } from 'vitest'
import * as tablecraft from '../src/index'

describe('root entry', () => {
  it('exports useFacetedFilters', () => {
    expect(typeof tablecraft.useFacetedFilters).toBe('function')
  })
})

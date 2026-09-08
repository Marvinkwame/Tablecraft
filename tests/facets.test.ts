import { describe, it, expect } from 'vitest'
import {
  buildFacetOptions,
  compareFacetValues,
  normalizeSelected,
  toggleValue,
  needsArrayFilterFn,
  needsRangeFilterFn,
  isRangeFilterFn,
  facetedFilterFn,
} from '../src/utils/facets'

describe('buildFacetOptions', () => {
  it('sorts by count descending', () => {
    const map = new Map<unknown, number>([['a', 1], ['b', 5], ['c', 3]])
    expect(buildFacetOptions(map, []).map((o) => o.value)).toEqual(['b', 'c', 'a'])
  })

  it('breaks count ties by value ascending', () => {
    const map = new Map<unknown, number>([['zebra', 2], ['apple', 2], ['mango', 2]])
    expect(buildFacetOptions(map, []).map((o) => o.value)).toEqual(['apple', 'mango', 'zebra'])
  })

  it('compares numeric values numerically, not as strings', () => {
    const map = new Map<unknown, number>([[10, 1], [9, 1], [100, 1]])
    expect(buildFacetOptions(map, []).map((o) => o.value)).toEqual([9, 10, 100])
  })

  it('drops null, undefined and empty-string values', () => {
    const map = new Map<unknown, number>([
      ['a', 3], [null, 2], [undefined, 2], ['', 2], ['b', 1],
    ])
    expect(buildFacetOptions(map, []).map((o) => o.value)).toEqual(['a', 'b'])
  })

  it('keeps zero as a value — it is not empty', () => {
    const map = new Map<unknown, number>([[0, 1]])
    expect(buildFacetOptions(map, []).map((o) => o.value)).toEqual([0])
  })

  it('marks selected values', () => {
    const map = new Map<unknown, number>([['a', 2], ['b', 1]])
    const options = buildFacetOptions(map, ['b'])
    expect(options.map((o) => [o.value, o.selected])).toEqual([['a', false], ['b', true]])
  })

  it('carries counts through unchanged', () => {
    const map = new Map<unknown, number>([['a', 7]])
    expect(buildFacetOptions(map, [])[0].count).toBe(7)
  })

  it('returns an empty array for an empty map', () => {
    expect(buildFacetOptions(new Map(), [])).toEqual([])
  })
})

describe('compareFacetValues', () => {
  it('orders numbers numerically', () => {
    expect(compareFacetValues(2, 10)).toBeLessThan(0)
  })

  it('orders strings lexicographically', () => {
    expect(compareFacetValues('a', 'b')).toBeLessThan(0)
  })

  it('falls back to string comparison for mixed types', () => {
    expect(compareFacetValues(1, 'a')).toBeLessThan(0)
  })
})

describe('normalizeSelected', () => {
  it('returns an empty array when there is no filter', () => {
    expect(normalizeSelected(undefined)).toEqual([])
    expect(normalizeSelected(null)).toEqual([])
  })

  it('passes an array filter through', () => {
    expect(normalizeSelected(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('wraps a scalar filter value in an array', () => {
    expect(normalizeSelected('a')).toEqual(['a'])
  })

  it('wraps a falsy-but-real scalar', () => {
    expect(normalizeSelected(0)).toEqual([0])
  })
})

describe('toggleValue', () => {
  it('adds to an empty selection', () => {
    expect(toggleValue([], 'a')).toEqual(['a'])
  })

  it('appends to an existing selection', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('removes one of several', () => {
    expect(toggleValue(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })

  it('returns an empty array when removing the last value', () => {
    expect(toggleValue(['a'], 'a')).toEqual([])
  })

  it('does not mutate the input', () => {
    const selected = ['a']
    toggleValue(selected, 'b')
    expect(selected).toEqual(['a'])
  })
})

describe('needsArrayFilterFn', () => {
  it('warns for an undefined filterFn', () => {
    expect(needsArrayFilterFn(undefined)).toBe(true)
  })

  it('warns for auto', () => {
    expect(needsArrayFilterFn('auto')).toBe(true)
  })

  it.each(['equals', 'weakEquals', 'includesString', 'includesStringSensitive', 'equalsString', 'inNumberRange'])(
    'warns for the scalar built-in %s',
    (fn) => {
      expect(needsArrayFilterFn(fn)).toBe(true)
    }
  )

  it.each(['arrIncludes', 'arrIncludesAll', 'arrIncludesSome'])(
    'does not warn for the array built-in %s',
    (fn) => {
      expect(needsArrayFilterFn(fn)).toBe(false)
    }
  )

  it('never warns for a custom function — it may handle arrays', () => {
    expect(needsArrayFilterFn(() => true)).toBe(false)
  })
})

describe('needsRangeFilterFn', () => {
  it('does not warn for inNumberRange', () => {
    expect(needsRangeFilterFn('inNumberRange')).toBe(false)
  })

  it('warns for anything else', () => {
    expect(needsRangeFilterFn('arrIncludesSome')).toBe(true)
    expect(needsRangeFilterFn(undefined)).toBe(true)
  })

  it('never warns for a custom function', () => {
    expect(needsRangeFilterFn(() => true)).toBe(false)
  })
})

describe('isRangeFilterFn', () => {
  it('is true for inNumberRange', () => {
    expect(isRangeFilterFn('inNumberRange')).toBe(true)
  })

  it('is false for facetedFilterFn', () => {
    expect(isRangeFilterFn(facetedFilterFn)).toBe(false)
  })

  it('is true for another custom function', () => {
    expect(isRangeFilterFn(() => true)).toBe(true)
  })

  it('is false for undefined', () => {
    expect(isRangeFilterFn(undefined)).toBe(false)
  })

  it('is false for arrIncludesSome', () => {
    expect(isRangeFilterFn('arrIncludesSome')).toBe(false)
  })
})

describe('facetedFilterFn', () => {
  const row = (value: unknown) => ({ getValue: () => value }) as any
  // The FilterFn call signature requires an addMeta callback as its 4th
  // argument; facetedFilterFn never calls it, so a no-op stands in.
  const addMeta = () => {}

  it('matches a value present in the selection', () => {
    expect(facetedFilterFn(row('Active'), 'status', ['Active', 'Pending'], addMeta)).toBe(true)
  })

  it('does not match a value absent from the selection', () => {
    expect(facetedFilterFn(row('Archived'), 'status', ['Active', 'Pending'], addMeta)).toBe(false)
  })

  it('does not substring-match — the bug arrIncludesSome had', () => {
    expect(facetedFilterFn(row('Super Admin'), 'role', ['Admin'], addMeta)).toBe(false)
  })

  it('matches numeric cell values — the case arrIncludesSome throws on', () => {
    expect(facetedFilterFn(row(30), 'price', [10, 20, 30], addMeta)).toBe(true)
    expect(facetedFilterFn(row(40), 'price', [10, 20, 30], addMeta)).toBe(false)
  })

  it('returns false for a non-array filter value, without throwing', () => {
    expect(() => facetedFilterFn(row('Active'), 'status', 'Active', addMeta)).not.toThrow()
    expect(facetedFilterFn(row('Active'), 'status', 'Active', addMeta)).toBe(false)
  })
})

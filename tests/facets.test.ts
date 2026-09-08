import { describe, it, expect } from 'vitest'
import {
  buildFacetOptions,
  compareFacetValues,
  normalizeSelected,
  toggleValue,
  needsArrayFilterFn,
  needsRangeFilterFn,
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

import { describe, it, expect } from 'vitest'
import { coerceValue } from '../src/utils/exportRows'

describe('coerceValue', () => {
  it('renders null and undefined as an empty string', () => {
    expect(coerceValue(null)).toBe('')
    expect(coerceValue(undefined)).toBe('')
  })

  it('renders a Date as ISO 8601', () => {
    expect(coerceValue(new Date('2026-08-06T14:23:11.000Z'))).toBe('2026-08-06T14:23:11.000Z')
  })

  it('renders primitives via String()', () => {
    expect(coerceValue('hi')).toBe('hi')
    expect(coerceValue(42)).toBe('42')
    expect(coerceValue(0)).toBe('0')
    expect(coerceValue(false)).toBe('false')
  })

  it('renders objects and arrays as JSON', () => {
    expect(coerceValue({ a: 1 })).toBe('{"a":1}')
    expect(coerceValue(['x', 'y'])).toBe('["x","y"]')
  })
})

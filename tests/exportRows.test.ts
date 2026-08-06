import { describe, it, expect } from 'vitest'
import { coerceValue, escapeCSVField, toCSVString } from '../src/utils/exportRows'

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

describe('escapeCSVField', () => {
  it('leaves plain fields alone', () => {
    expect(escapeCSVField('hello', ',')).toBe('hello')
  })

  it('quotes a field containing the delimiter', () => {
    expect(escapeCSVField('a,b', ',')).toBe('"a,b"')
    expect(escapeCSVField('a;b', ';')).toBe('"a;b"')
  })

  it('quotes and doubles embedded double quotes', () => {
    expect(escapeCSVField('say "hi"', ',')).toBe('"say ""hi"""')
  })

  it('quotes fields containing newlines', () => {
    expect(escapeCSVField('a\nb', ',')).toBe('"a\nb"')
    expect(escapeCSVField('a\r\nb', ',')).toBe('"a\r\nb"')
  })
})

describe('toCSVString', () => {
  const labels = ['Name', 'Age']
  const rows = [
    { Name: 'Ada', Age: 36 },
    { Name: 'Alan', Age: 41 },
  ]

  it('emits a header row and CRLF line endings with a trailing newline', () => {
    expect(toCSVString(rows, labels)).toBe('Name,Age\r\nAda,36\r\nAlan,41\r\n')
  })

  it('omits the header row when header is false', () => {
    expect(toCSVString(rows, labels, { header: false })).toBe('Ada,36\r\nAlan,41\r\n')
  })

  it('honours a custom delimiter', () => {
    expect(toCSVString(rows, labels, { delimiter: ';' })).toBe('Name;Age\r\nAda;36\r\nAlan;41\r\n')
  })

  it('coerces values and escapes them', () => {
    expect(toCSVString([{ Name: 'a,b', Age: null }], labels)).toBe('Name,Age\r\n"a,b",\r\n')
  })

  it('returns an empty string for no rows and no header', () => {
    expect(toCSVString([], labels, { header: false })).toBe('')
  })

  it('emits just the header when there are no rows', () => {
    expect(toCSVString([], labels)).toBe('Name,Age\r\n')
  })
})

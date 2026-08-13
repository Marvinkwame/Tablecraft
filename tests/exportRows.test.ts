import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { coerceValue, escapeCSVField, toCSVString, resolveColumnLabel, dedupeLabels, extractRows } from '../src/utils/exportRows'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

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

describe('resolveColumnLabel', () => {
  it('uses a string header verbatim', () => {
    expect(resolveColumnLabel('Full Name', 'name')).toBe('Full Name')
  })

  it('humanizes the column id when the header is a function', () => {
    expect(resolveColumnLabel(() => null, 'firstName')).toBe('First Name')
  })

  it('humanizes the column id when there is no header', () => {
    expect(resolveColumnLabel(undefined, 'created_at')).toBe('Created At')
  })

  it('humanizes the column id when the header is an empty string', () => {
    expect(resolveColumnLabel('', 'user_id')).toBe('User Id')
  })
})

describe('dedupeLabels', () => {
  it('leaves unique labels untouched', () => {
    expect(dedupeLabels(['Name', 'Age'])).toEqual(['Name', 'Age'])
  })

  it('suffixes repeats so no key is lost', () => {
    expect(dedupeLabels(['Name', 'Name', 'Name'])).toEqual(['Name', 'Name (2)', 'Name (3)'])
  })

  it('tracks each label independently', () => {
    expect(dedupeLabels(['A', 'B', 'A', 'B'])).toEqual(['A', 'B', 'A (2)', 'B (2)'])
  })

  it('does not let a generated suffix collide with an existing label', () => {
    const result = dedupeLabels(['Name', 'Name', 'Name (2)'])
    expect(new Set(result).size).toBe(result.length)
    expect(result).toEqual(['Name', 'Name (2)', 'Name (2) (2)'])
  })
})

type Person = { id: number; name: string; age: number }

const people: Person[] = [
  { id: 1, name: 'Carol', age: 41 },
  { id: 2, name: 'Alice', age: 30 },
  { id: 3, name: 'Bob', age: 25 },
]

const personColumns = createColumns<Person>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
])

function makeTable(overrides: Record<string, unknown> = {}) {
  const { result } = renderHook(() =>
    useTable<Person>({ data: people, columns: personColumns, ...overrides })
  )
  return result.current.table
}

describe('extractRows', () => {
  it('returns labels and label-keyed rows', () => {
    const { labels, rows } = extractRows(makeTable())
    expect(labels).toEqual(['Name', 'Age'])
    expect(rows[0]).toEqual({ Name: 'Carol', Age: 41 })
  })

  it('keeps raw value types rather than stringifying', () => {
    const { rows } = extractRows(makeTable())
    expect(typeof rows[0].Age).toBe('number')
  })

  it("'filtered' reflects the active sort order, not the data order", () => {
    const table = makeTable({ sorting: { defaultSort: [{ id: 'name', desc: false }] } })
    const { rows } = extractRows(table, { rows: 'filtered' })
    expect(rows.map((r) => r.Name)).toEqual(['Alice', 'Bob', 'Carol'])
  })

  it("'filtered' spans all pages, 'page' does not", () => {
    const table = makeTable({ pagination: { pageSize: 2 } })
    expect(extractRows(table, { rows: 'filtered' }).rows).toHaveLength(3)
    expect(extractRows(table, { rows: 'page' }).rows).toHaveLength(2)
  })

  it("'all' ignores an active filter", () => {
    const table = makeTable()
    table.setGlobalFilter('Alice')
    expect(extractRows(table, { rows: 'all' }).rows).toHaveLength(3)
  })

  it('excludes hidden columns by default and includes them under columns: all', () => {
    const table = makeTable({ columnVisibility: true })
    act(() => {
      table.getColumn('age')!.toggleVisibility(false)
    })
    expect(extractRows(table).labels).toEqual(['Name'])
    expect(extractRows(table, { columns: 'all' }).labels).toEqual(['Name', 'Age'])
  })

  it('honours include and exclude, ignoring unknown ids', () => {
    const table = makeTable()
    expect(extractRows(table, { include: ['name', 'nope'] }).labels).toEqual(['Name'])
    expect(extractRows(table, { exclude: ['age'] }).labels).toEqual(['Name'])
  })

  it('uses meta.exportValue when present and never calls the cell renderer', () => {
    const cell = vi.fn(() => null)
    const cols = createColumns<Person>([
      { accessorKey: 'name', header: 'Name', cell },
      { accessorKey: 'age', header: 'Age', meta: { exportValue: (row) => `${row.original.age}y` } },
    ])
    const { result } = renderHook(() => useTable<Person>({ data: people, columns: cols }))
    const { rows } = extractRows(result.current.table)
    expect(rows[0]).toEqual({ Name: 'Carol', Age: '41y' })
    expect(cell).not.toHaveBeenCalled()
  })
})

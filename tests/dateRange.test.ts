import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'
import { inDateRange, toDateRange } from '../src/utils/dates'

// Local construction throughout. An ISO string with Z would encode UTC into
// the expectations, which is exactly the thing these tests exist to catch.
const row = (value: unknown) => ({ getValue: () => value }) as any
const addMeta = () => {}

/** `inDateRange(cell, range)` with the 4-argument FilterFn signature. */
const match = (cell: unknown, range: [number | null, number | null]) =>
  inDateRange(row(cell), 'created', range, addMeta)

describe('toDateRange', () => {
  it('accepts a Date, an ISO string and an epoch number for either side', () => {
    const d = new Date(2026, 2, 15, 9, 30)
    const [fromDate] = toDateRange(d, null)
    const [fromIso] = toDateRange(d.toISOString(), null)
    const [fromEpoch] = toDateRange(d.getTime(), null)

    expect(fromDate).toBe(d.getTime())
    expect(fromIso).toBe(d.getTime())
    expect(fromEpoch).toBe(d.getTime())
  })

  it('returns null for a null bound', () => {
    expect(toDateRange(null, null)).toEqual([null, null])
  })

  it('returns null rather than NaN for an unparseable bound', () => {
    // NaN survives neither JSON nor comparison, so it must never reach state.
    expect(toDateRange('not a date', null)).toEqual([null, null])
  })

  it('reads a date-only string as local midnight, not UTC', () => {
    // `new Date('2026-03-08')` is UTC midnight, which in any negative-offset
    // zone is the previous local day — so a range built from date-only strings
    // would filter to the wrong day. Caught by the America/New_York test.
    const [from] = toDateRange('2026-03-08', null)

    expect(from).toBe(new Date(2026, 2, 8).getTime())
  })

  it('returns a fresh array', () => {
    const a = toDateRange(0, 1)
    const b = toDateRange(0, 1)

    expect(a).toEqual(b)
    expect(a).not.toBe(b)
  })
})

describe('inDateRange', () => {
  const march = toDateRange('2026-03-15', '2026-03-31')

  it('includes a row late on the final day', () => {
    // The case D3 exists for: comparing instants would parse the upper bound
    // as 31 March midnight and exclude this row.
    expect(match(new Date(2026, 2, 31, 14, 0), march)).toBe(true)
  })

  it('includes a row at the very start of the first day', () => {
    expect(match(new Date(2026, 2, 15, 0, 0, 0, 0), march)).toBe(true)
  })

  it('excludes the day before and the day after', () => {
    expect(match(new Date(2026, 2, 14, 23, 59), march)).toBe(false)
    expect(match(new Date(2026, 3, 1, 0, 0), march)).toBe(false)
  })

  it('includes anything later when the upper bound is open', () => {
    const open = toDateRange('2026-03-15', null)

    expect(match(new Date(2030, 0, 1), open)).toBe(true)
    expect(match(new Date(2026, 2, 14, 23, 59), open)).toBe(false)
  })

  it('includes anything earlier when the lower bound is open', () => {
    const open = toDateRange(null, '2026-03-31')

    expect(match(new Date(2000, 0, 1), open)).toBe(true)
    expect(match(new Date(2026, 3, 1), open)).toBe(false)
  })

  it('matches every row when both bounds are open', () => {
    expect(match(new Date(1999, 0, 1), [null, null])).toBe(true)
    expect(match(new Date(2099, 0, 1), [null, null])).toBe(true)
  })

  it('matches a single day when both bounds are the same date', () => {
    const oneDay = toDateRange('2026-03-15', '2026-03-15')

    expect(match(new Date(2026, 2, 15, 0, 0, 0, 0), oneDay)).toBe(true)
    expect(match(new Date(2026, 2, 15, 23, 59, 59, 999), oneDay)).toBe(true)
    expect(match(new Date(2026, 2, 16, 0, 0), oneDay)).toBe(false)
  })

  it('matches nothing when the range is reversed', () => {
    const reversed = toDateRange('2026-03-31', '2026-03-15')

    expect(() => match(new Date(2026, 2, 20), reversed)).not.toThrow()
    expect(match(new Date(2026, 2, 20), reversed)).toBe(false)
    expect(match(new Date(2026, 2, 31, 12), reversed)).toBe(false)
    expect(match(new Date(2026, 2, 15, 12), reversed)).toBe(false)
  })

  it('treats a numeric cell value as epoch milliseconds', () => {
    // 2026 is an instant in 1970, not the year. There is no sane alternative
    // reading, so this pins it rather than guessing.
    expect(match(2026, march)).toBe(false)
    expect(match(new Date(2026, 2, 20).getTime(), march)).toBe(true)
  })

  it('returns false for null, empty-string and unparseable cell values', () => {
    for (const bad of [null, undefined, '', 'not a date', NaN]) {
      expect(() => match(bad, march)).not.toThrow()
      expect(match(bad, march)).toBe(false)
    }
  })
})

describe('date range — round trip', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  type Product = { id: number; created: number }
  const products: Product[] = [
    { id: 1, created: new Date(2026, 2, 10).getTime() },
    { id: 2, created: new Date(2026, 2, 20).getTime() },
    { id: 3, created: new Date(2026, 3, 5).getTime() },
  ]
  const productColumns = createColumns<Product>([
    { accessorKey: 'created', header: 'Created', filterFn: inDateRange },
  ])

  const mount = () =>
    renderHook(() =>
      useTable({
        data: products,
        columns: productColumns,
        columnFilters: true,
        pagination: false,
        persist: 'localStorage',
        persistKey: 'date-round-trip',
      })
    )

  it('survives persistence and still filters the same rows', () => {
    const first = mount()

    act(() =>
      first.result.current.columnFilters.setFilter(
        'created',
        toDateRange('2026-03-01', '2026-03-31')
      )
    )

    expect(first.result.current.table.getRowModel().rows.map((r) => r.original.id)).toEqual([1, 2])

    // What D2 bought: plain numbers, not Dates or ISO strings. This is the
    // assertion that fails if the stored shape ever changes.
    const stored = JSON.parse(localStorage.getItem('tablecraft:date-round-trip')!)
    const value = stored.columnFilters.find((f: { id: string }) => f.id === 'created').value
    expect(value.every((v: unknown) => typeof v === 'number')).toBe(true)

    const second = mount()
    expect(second.result.current.table.getRowModel().rows.map((r) => r.original.id)).toEqual([1, 2])
  })
})

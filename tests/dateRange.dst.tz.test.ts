// Runs under America/New_York so a DST transition is in play.
//
// A separate file from dateRange.tz.test.ts on purpose: Node resolves the zone
// once per process, so two zones in one file would silently test one of them
// twice. Both files run under vitest.tz.config.ts, which uses the forks pool —
// the only place process.env.TZ is honoured.
//
// 2026-03-08 is the US spring-forward date: that local day is 23 hours long and
// has no 02:00. A generic "00:00 and 23:00 exist on every day" assertion would
// be wrong in zones that skip midnight, so this pins a fixed date and zone.
// This repo has no @types/node, so `process` is not ambiently typed. Same
// local declaration src/hooks/useFacetedFilters.ts uses.
declare const process: { env: { TZ?: string } }

process.env.TZ = 'America/New_York'

import { describe, it, expect } from 'vitest'

describe('inDateRange across a DST transition', () => {
  it('has the TZ override actually in effect', () => {
    // EST is UTC-5 on the 8th before the 02:00 jump.
    expect(new Date(2026, 2, 8, 0, 30).getTimezoneOffset()).toBe(300)
  })

  it('matches the whole of a 23-hour day', async () => {
    const { inDateRange, toDateRange } = await import('../src/utils/dates')

    const row = (value: unknown) => ({ getValue: () => value }) as any
    const springForward = toDateRange('2026-03-08', '2026-03-08')
    const match = (cell: unknown) =>
      inDateRange(row(cell), 'created', springForward, () => {})

    // Before the gap, after the gap, and the last minute of a day that is an
    // hour shorter than usual.
    expect(match(new Date(2026, 2, 8, 0, 30))).toBe(true)
    expect(match(new Date(2026, 2, 8, 3, 0))).toBe(true)
    expect(match(new Date(2026, 2, 8, 23, 59))).toBe(true)

    expect(match(new Date(2026, 2, 7, 23, 59))).toBe(false)
    expect(match(new Date(2026, 2, 9, 0, 1))).toBe(false)
  })

  it('normalises bounds set directly, not only those from toDateRange', async () => {
    const { inDateRange } = await import('../src/utils/dates')
    const row = (value: unknown) => ({ getValue: () => value }) as any

    // The docs bless writing the array yourself. Only the cell value went
    // through toEpoch; a date-only bound stayed UTC midnight — the bug fixed
    // inside toEpoch, surviving one layer out. It shows only at a negative
    // offset: in UTC+14 the error pushes the other way and disappears, which
    // is why every other test missed it.
    const direct = ['2026-03-15', '2026-03-31'] as unknown as [number | null, number | null]

    expect(inDateRange(row(new Date(2026, 2, 31, 14, 0)), 'created', direct, () => {})).toBe(true)
    expect(inDateRange(row(new Date(2026, 2, 14, 10, 0)), 'created', direct, () => {})).toBe(false)
  })
})

// Runs under Pacific/Kiritimati (UTC+14), the largest positive offset there is.
//
// Under TZ=UTC a local-day and a UTC-day implementation are indistinguishable,
// so without this file D3 is unguarded: a change from getFullYear/getMonth/
// getDate back to the getUTC* family would pass CI in silence.
//
// Set before the module under test is imported — hence the dynamic import
// below. Node resolves the zone once, so this file must not also test a
// second timezone; America/New_York has its own file.
// This repo has no @types/node, so `process` is not ambiently typed. Same
// local declaration src/hooks/useFacetedFilters.ts uses.
declare const process: { env: { TZ?: string } }

process.env.TZ = 'Pacific/Kiritimati'

import { describe, it, expect } from 'vitest'

const row = (value: unknown) => ({ getValue: () => value }) as any

describe('inDateRange under UTC+14', () => {
  it('has the TZ override actually in effect', () => {
    // The guard. If vitest's worker already resolved a different zone, every
    // assertion below would pass vacuously against a UTC implementation.
    expect(new Date(2026, 2, 15).getTimezoneOffset()).toBe(-840)
  })

  it('reads a date range as local days, not UTC days', async () => {
    const { inDateRange, toDateRange } = await import('../src/utils/dates')
    const oneDay = toDateRange('2026-03-15', '2026-03-15')

    // Local midnight on 15 March here is 14 March 10:00Z. A getUTC*
    // implementation puts this row on the 14th and excludes it.
    expect(inDateRange(row(new Date(2026, 2, 15, 0, 30)), 'created', oneDay, () => {})).toBe(true)
    expect(inDateRange(row(new Date(2026, 2, 15, 23, 30)), 'created', oneDay, () => {})).toBe(true)
    expect(inDateRange(row(new Date(2026, 2, 16, 0, 30)), 'created', oneDay, () => {})).toBe(false)
  })
})

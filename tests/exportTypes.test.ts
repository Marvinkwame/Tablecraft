import { describe, it, expect } from 'vitest'
import { createColumns } from '../src/helpers/createColumns'
import type { UseTableExportOptions, TableExportReturn } from '../src/types'

type User = { id: number; name: string; createdAt: Date }

describe('export types', () => {
  it('accepts meta.exportValue and preserves the function it was given', () => {
    const columns = createColumns<User>([
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        meta: { exportValue: (row) => row.original.createdAt.toISOString().slice(0, 10) },
      },
    ])

    // The real gate is that `npm run lint` accepts `meta.exportValue` at all —
    // without the augmentation, tsc rejects it. This asserts the value survives
    // and behaves, so the test fails loudly rather than passing vacuously.
    const exportValue = columns[1].meta?.exportValue
    expect(exportValue).toBeTypeOf('function')
    expect(
      exportValue!({ original: { id: 1, name: 'Ada', createdAt: new Date('2026-08-06T09:00:00Z') } } as never)
    ).toBe('2026-08-06')
  })

  it('exposes the documented option and return shapes', () => {
    const options: UseTableExportOptions = {
      rows: 'selected',
      columns: 'all',
      include: ['name'],
      exclude: ['id'],
      delimiter: ';',
      header: false,
    }
    expect(options.rows).toBe('selected')

    const shape: (keyof TableExportReturn)[] = ['toRows', 'toCSV', 'toJSON', 'download']
    expect(shape).toHaveLength(4)
  })
})

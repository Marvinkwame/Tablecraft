import { describe, it, expect } from 'vitest'
import { createColumns } from '../src/helpers/createColumns'

type User = { id: number; name: string; email: string }

describe('createColumns', () => {
  it('returns the same column definitions passed in', () => {
    const columns = createColumns<User>([
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
    ])

    expect(columns).toHaveLength(2)
    expect(columns[0]).toHaveProperty('accessorKey', 'name')
    expect(columns[1]).toHaveProperty('accessorKey', 'email')
  })

  it('preserves custom column properties', () => {
    const columns = createColumns<User>([
      { accessorKey: 'name', header: 'Name', enableSorting: false },
    ])

    expect(columns[0]).toHaveProperty('enableSorting', false)
  })

  it('handles empty column array', () => {
    const columns = createColumns<User>([])
    expect(columns).toHaveLength(0)
  })

  it('supports id-only columns (no accessorKey)', () => {
    const columns = createColumns<User>([
      { id: 'actions', header: 'Actions' },
    ])

    expect(columns[0]).toHaveProperty('id', 'actions')
  })
})

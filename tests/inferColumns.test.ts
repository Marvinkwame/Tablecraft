import { describe, it, expect } from 'vitest'
import { inferColumns } from '../src/helpers/inferColumns'

type User = {
  id: number
  firstName: string
  email: string
  created_at: string
  age: number
  isActive: boolean
}

const sampleData: User[] = [
  { id: 1, firstName: 'Marvin', email: 'marvin@test.com', created_at: '2024-01-01', age: 25, isActive: true },
  { id: 2, firstName: 'Alice', email: 'alice@test.com', created_at: '2024-02-01', age: 30, isActive: false },
]

describe('inferColumns', () => {
  it('generates columns from data shape', () => {
    const columns = inferColumns(sampleData)

    expect(columns.length).toBe(6)
    expect(columns[0]).toHaveProperty('accessorKey', 'id')
    expect(columns[1]).toHaveProperty('accessorKey', 'firstName')
  })

  it('generates human-readable headers from camelCase keys', () => {
    const columns = inferColumns(sampleData)
    const firstNameCol = columns.find((c: any) => c.accessorKey === 'firstName')

    expect(firstNameCol).toHaveProperty('header', 'First Name')
  })

  it('generates human-readable headers from snake_case keys', () => {
    const columns = inferColumns(sampleData)
    const createdAtCol = columns.find((c: any) => c.accessorKey === 'created_at')

    expect(createdAtCol).toHaveProperty('header', 'Created At')
  })

  it('excludes specified keys', () => {
    const columns = inferColumns(sampleData, { exclude: ['id', 'created_at'] })

    const keys = columns.map((c: any) => c.accessorKey)
    expect(keys).not.toContain('id')
    expect(keys).not.toContain('created_at')
    expect(keys).toContain('firstName')
    expect(columns.length).toBe(4)
  })

  it('includes only specified keys (whitelist mode)', () => {
    const columns = inferColumns(sampleData, { include: ['firstName', 'email'] })

    const keys = columns.map((c: any) => c.accessorKey)
    expect(keys).toEqual(['firstName', 'email'])
    expect(columns.length).toBe(2)
  })

  it('preserves include order', () => {
    const columns = inferColumns(sampleData, { include: ['email', 'firstName', 'age'] })

    const keys = columns.map((c: any) => c.accessorKey)
    expect(keys).toEqual(['email', 'firstName', 'age'])
  })

  it('applies overrides to specific columns', () => {
    const columns = inferColumns(sampleData, {
      overrides: {
        firstName: { header: 'Full Name' },
        created_at: { header: 'Joined' },
      },
    })

    const firstNameCol = columns.find((c: any) => c.accessorKey === 'firstName')
    const createdAtCol = columns.find((c: any) => c.accessorKey === 'created_at')

    expect(firstNameCol).toHaveProperty('header', 'Full Name')
    expect(createdAtCol).toHaveProperty('header', 'Joined')
  })

  it('returns empty array for empty data', () => {
    const columns = inferColumns([])
    expect(columns).toEqual([])
  })

  it('skips nested objects', () => {
    const dataWithNested = [
      { id: 1, name: 'Test', address: { street: '123', city: 'NYC' } },
    ]

    const columns = inferColumns(dataWithNested)
    const keys = columns.map((c: any) => c.accessorKey)

    expect(keys).toContain('id')
    expect(keys).toContain('name')
    expect(keys).not.toContain('address')
  })

  it('skips arrays', () => {
    const dataWithArrays = [
      { id: 1, name: 'Test', tags: ['admin', 'user'] },
    ]

    const columns = inferColumns(dataWithArrays)
    const keys = columns.map((c: any) => c.accessorKey)

    expect(keys).toContain('id')
    expect(keys).toContain('name')
    expect(keys).not.toContain('tags')
  })

  it('handles null and undefined values gracefully', () => {
    const dataWithNulls = [
      { id: 1, name: 'Test', bio: null, avatar: undefined },
    ]

    const columns = inferColumns(dataWithNulls)
    const keys = columns.map((c: any) => c.accessorKey)

    // null/undefined are scalar-ish, keep them
    expect(keys).toContain('bio')
    expect(keys).toContain('avatar')
  })

  it('combines include with overrides', () => {
    const columns = inferColumns(sampleData, {
      include: ['firstName', 'email'],
      overrides: {
        firstName: { header: 'Name' },
      },
    })

    expect(columns.length).toBe(2)
    expect(columns[0]).toHaveProperty('header', 'Name')
    expect(columns[1]).toHaveProperty('header', 'Email')
  })
})

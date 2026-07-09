import { describe, it, expect } from 'vitest'
import { generateEmployees } from '../data/seed'

describe('generateEmployees', () => {
  it('returns exactly `count` employees with sequential ids', () => {
    const rows = generateEmployees(200)
    expect(rows).toHaveLength(200)
    expect(rows[0].id).toBe(1)
    expect(rows[199].id).toBe(200)
  })

  it('is deterministic for the same count', () => {
    expect(generateEmployees(50)).toEqual(generateEmployees(50))
  })

  it('produces valid field shapes', () => {
    const [row] = generateEmployees(1)
    expect(typeof row.name).toBe('string')
    expect(row.email).toMatch(/^[^@]+@example\.com$/)
    expect(['active', 'invited', 'suspended']).toContain(row.status)
    expect(typeof row.salary).toBe('number')
    expect(new Date(row.lastActive).toString()).not.toBe('Invalid Date')
    expect(Object.keys(row).sort()).toEqual(['department', 'email', 'id', 'lastActive', 'name', 'role', 'salary', 'status'])
  })

  it('handles large counts without duplicating ids', () => {
    const rows = generateEmployees(50_000)
    expect(rows).toHaveLength(50_000)
    expect(new Set(rows.map((r) => r.id)).size).toBe(50_000)
  })
})

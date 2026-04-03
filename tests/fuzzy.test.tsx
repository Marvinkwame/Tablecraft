import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

type User = { id: number; name: string; role: string }

const testData: User[] = [
  { id: 1, name: 'Marvin', role: 'admin' },
  { id: 2, name: 'Alice', role: 'editor' },
  { id: 3, name: 'Bob', role: 'viewer' },
  { id: 4, name: 'Charlie', role: 'admin' },
  { id: 5, name: 'Martin', role: 'editor' },
]

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
])

describe('fuzzy search', () => {
  it('enables fuzzy filtering when fuzzy: true', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, fuzzy: true, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('mrvn')
    })

    const rows = result.current.table.getRowModel().rows
    const names = rows.map((r) => r.original.name)

    // "mrvn" should fuzzy match "Marvin"
    expect(names).toContain('Marvin')
  })

  it('fuzzy matches partial strings', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, fuzzy: true, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('adm')
    })

    const rows = result.current.table.getRowModel().rows
    // Should match rows with "admin" role
    expect(rows.length).toBeGreaterThan(0)
  })

  it('returns all rows when filter is empty', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, fuzzy: true, pagination: false })
    )

    expect(result.current.table.getRowModel().rows).toHaveLength(5)
  })

  it('returns no rows for completely unrelated filter', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, fuzzy: true, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('zzzzxxxxxqqqq')
    })

    expect(result.current.table.getRowModel().rows).toHaveLength(0)
  })

  it('works normally without fuzzy (exact substring)', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, fuzzy: false, pagination: false })
    )

    act(() => {
      result.current.globalFilter.setValue('Marvin')
    })

    const rows = result.current.table.getRowModel().rows
    expect(rows).toHaveLength(1)
    expect(rows[0].original.name).toBe('Marvin')
  })
})

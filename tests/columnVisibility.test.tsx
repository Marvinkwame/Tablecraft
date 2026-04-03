import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnVisibilityState } from '../src/hooks/useColumnVisibilityState'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

// ─── Granular hook tests ──────────────────────────────────

describe('useColumnVisibilityState', () => {
  it('starts with all columns visible by default', () => {
    const { result } = renderHook(() => useColumnVisibilityState())
    expect(result.current.state).toEqual({})
    expect(result.current.hiddenColumns).toEqual([])
  })

  it('accepts default visibility', () => {
    const { result } = renderHook(() =>
      useColumnVisibilityState({ defaultVisibility: { email: false, age: false } })
    )
    expect(result.current.hiddenColumns).toEqual(['email', 'age'])
  })

  it('toggleColumn hides a visible column', () => {
    const { result } = renderHook(() => useColumnVisibilityState())

    act(() => result.current.toggleColumn('name'))
    expect(result.current.state.name).toBe(false)
    expect(result.current.hiddenColumns).toContain('name')
  })

  it('toggleColumn shows a hidden column', () => {
    const { result } = renderHook(() =>
      useColumnVisibilityState({ defaultVisibility: { name: false } })
    )

    act(() => result.current.toggleColumn('name'))
    expect(result.current.state.name).toBe(true)
    expect(result.current.hiddenColumns).not.toContain('name')
  })

  it('hideColumn hides a specific column', () => {
    const { result } = renderHook(() => useColumnVisibilityState())

    act(() => result.current.hideColumn('email'))
    expect(result.current.hiddenColumns).toContain('email')
  })

  it('showColumn makes a hidden column visible', () => {
    const { result } = renderHook(() =>
      useColumnVisibilityState({ defaultVisibility: { email: false } })
    )

    act(() => result.current.showColumn('email'))
    expect(result.current.hiddenColumns).not.toContain('email')
  })

  it('showAll resets all columns to visible', () => {
    const { result } = renderHook(() =>
      useColumnVisibilityState({ defaultVisibility: { name: false, email: false, age: false } })
    )

    expect(result.current.hiddenColumns).toHaveLength(3)

    act(() => result.current.showAll())
    expect(result.current.hiddenColumns).toHaveLength(0)
    expect(result.current.state).toEqual({})
  })

  it('hiddenColumns only includes columns set to false', () => {
    const { result } = renderHook(() =>
      useColumnVisibilityState({ defaultVisibility: { name: false, email: true } })
    )

    expect(result.current.hiddenColumns).toEqual(['name'])
  })
})

// ─── useTable integration tests ───────────────────────────

type User = { id: number; name: string; email: string; age: number }

const testData: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@test.com`,
  age: 20 + i,
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'age', header: 'Age' },
])

describe('useTable column visibility integration', () => {
  it('returns columnVisibility when enabled', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, columnVisibility: true })
    )

    expect(result.current.columnVisibility).toBeDefined()
    expect(result.current.columnVisibility.hiddenColumns).toEqual([])
  })

  it('hides a column through useTable', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, columnVisibility: true })
    )

    act(() => result.current.columnVisibility.hideColumn('email'))
    expect(result.current.columnVisibility.hiddenColumns).toContain('email')

    // Verify column is removed from visible columns
    const visibleColumnIds = result.current.table.getVisibleLeafColumns().map((c) => c.id)
    expect(visibleColumnIds).not.toContain('email')
    expect(visibleColumnIds).toContain('name')
    expect(visibleColumnIds).toContain('age')
  })

  it('initializes with default hidden columns', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        columnVisibility: { defaultVisibility: { email: false } },
      })
    )

    expect(result.current.columnVisibility.hiddenColumns).toContain('email')

    const visibleColumnIds = result.current.table.getVisibleLeafColumns().map((c) => c.id)
    expect(visibleColumnIds).not.toContain('email')
  })

  it('showAll restores all columns through useTable', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        columnVisibility: { defaultVisibility: { email: false, age: false } },
      })
    )

    expect(result.current.table.getVisibleLeafColumns()).toHaveLength(1) // only 'name'

    act(() => result.current.columnVisibility.showAll())
    expect(result.current.table.getVisibleLeafColumns()).toHaveLength(3)
  })
})

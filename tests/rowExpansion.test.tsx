import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRowExpansionState } from '../src/hooks/useRowExpansionState'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

// ─── Granular hook tests ──────────────────────────────────

describe('useRowExpansionState', () => {
  it('starts with empty expansion by default', () => {
    const { result } = renderHook(() => useRowExpansionState())
    expect(result.current.state).toEqual({})
    expect(result.current.expandedRowIds).toEqual([])
    expect(result.current.isExpanded('0')).toBe(false)
  })

  it('accepts defaultExpanded', () => {
    const { result } = renderHook(() =>
      useRowExpansionState({ defaultExpanded: { '1': true, '3': true } })
    )
    expect(result.current.expandedRowIds).toEqual(['1', '3'])
    expect(result.current.isExpanded('1')).toBe(true)
    expect(result.current.isExpanded('0')).toBe(false)
  })

  it('toggleRow expands then collapses the same row', () => {
    const { result } = renderHook(() => useRowExpansionState())

    act(() => result.current.toggleRow('2'))
    expect(result.current.isExpanded('2')).toBe(true)
    expect(result.current.expandedRowIds).toContain('2')

    act(() => result.current.toggleRow('2'))
    expect(result.current.isExpanded('2')).toBe(false)
    expect(result.current.expandedRowIds).toEqual([])
  })

  it('allowMultiple: true (default) keeps multiple rows expanded', () => {
    const { result } = renderHook(() => useRowExpansionState())

    act(() => result.current.expandRow('0'))
    act(() => result.current.expandRow('1'))
    act(() => result.current.expandRow('2'))

    expect(result.current.expandedRowIds).toHaveLength(3)
    expect(result.current.isExpanded('0')).toBe(true)
    expect(result.current.isExpanded('1')).toBe(true)
    expect(result.current.isExpanded('2')).toBe(true)
  })

  it('allowMultiple: false collapses previous row when new one expands', () => {
    const { result } = renderHook(() =>
      useRowExpansionState({ allowMultiple: false })
    )

    act(() => result.current.expandRow('0'))
    expect(result.current.expandedRowIds).toEqual(['0'])

    act(() => result.current.expandRow('1'))
    expect(result.current.expandedRowIds).toEqual(['1'])
    expect(result.current.isExpanded('0')).toBe(false)
  })

  it('allowMultiple: false toggleRow deselects same row on second toggle', () => {
    const { result } = renderHook(() =>
      useRowExpansionState({ allowMultiple: false })
    )

    act(() => result.current.toggleRow('2'))
    expect(result.current.isExpanded('2')).toBe(true)

    act(() => result.current.toggleRow('2'))
    expect(result.current.isExpanded('2')).toBe(false)
    expect(result.current.expandedRowIds).toEqual([])
  })

  it('collapseRow removes a specific row while leaving others expanded', () => {
    const { result } = renderHook(() =>
      useRowExpansionState({ defaultExpanded: { '0': true, '1': true, '2': true } })
    )

    act(() => result.current.collapseRow('1'))

    expect(result.current.isExpanded('1')).toBe(false)
    expect(result.current.isExpanded('0')).toBe(true)
    expect(result.current.isExpanded('2')).toBe(true)
    expect(result.current.expandedRowIds).toHaveLength(2)
  })

  it('clearExpansion collapses all expanded rows', () => {
    const { result } = renderHook(() =>
      useRowExpansionState({ defaultExpanded: { '0': true, '1': true, '2': true } })
    )

    act(() => result.current.clearExpansion())

    expect(result.current.expandedRowIds).toEqual([])
    expect(result.current.state).toEqual({})
  })
})

// ─── useTable integration tests ───────────────────────────

type Category = { id: number; name: string; subRows?: Category[] }

const flat: Category[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  name: `Category ${i}`,
}))

const nested: Category[] = [
  {
    id: 0,
    name: 'Parent A',
    subRows: [
      { id: 1, name: 'Child A1' },
      { id: 2, name: 'Child A2' },
    ],
  },
  { id: 3, name: 'Parent B' },
]

const columns = createColumns<Category>([
  { accessorKey: 'name', header: 'Name' },
])

describe('useTable row expansion integration', () => {
  it('wires rowExpansion state when enabled, and toggleRow updates isExpanded', () => {
    const { result } = renderHook(() =>
      useTable({ data: flat, columns, rowExpansion: true })
    )

    expect(result.current.rowExpansion).toBeDefined()
    expect(result.current.rowExpansion.state).toEqual({})
    expect(result.current.rowExpansion.expandedRowIds).toEqual([])

    act(() => result.current.rowExpansion.toggleRow('0'))
    expect(result.current.rowExpansion.isExpanded('0')).toBe(true)
  })

  it('passes getSubRows to TanStack so nested rows appear in the row model', () => {
    const { result } = renderHook(() =>
      useTable({
        data: nested,
        columns,
        rowExpansion: {
          getSubRows: (row: Category) => row.subRows,
        },
      })
    )

    // With getSubRows wired, TanStack knows about sub-rows even before expanding
    const rows = result.current.table.getCoreRowModel().rows
    expect(rows).toHaveLength(2) // two top-level rows
    expect(rows[0].subRows).toHaveLength(2) // Parent A has 2 children
  })
})

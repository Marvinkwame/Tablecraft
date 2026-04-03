import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRowSelectionState } from '../src/hooks/useRowSelectionState'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

// ─── Granular hook tests ──────────────────────────────────

describe('useRowSelectionState', () => {
  it('starts with empty selection by default', () => {
    const { result } = renderHook(() => useRowSelectionState())
    expect(result.current.state).toEqual({})
    expect(result.current.selectedRowIds).toEqual([])
    expect(result.current.selectedCount).toBe(0)
  })

  it('accepts default selection', () => {
    const { result } = renderHook(() =>
      useRowSelectionState({ defaultSelection: { '0': true, '2': true } })
    )
    expect(result.current.selectedRowIds).toEqual(['0', '2'])
    expect(result.current.selectedCount).toBe(2)
  })

  it('toggleRow selects and deselects a row', () => {
    const { result } = renderHook(() => useRowSelectionState())

    act(() => result.current.toggleRow('1'))
    expect(result.current.isSelected('1')).toBe(true)
    expect(result.current.selectedCount).toBe(1)

    act(() => result.current.toggleRow('1'))
    expect(result.current.isSelected('1')).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('supports multi-row selection by default', () => {
    const { result } = renderHook(() => useRowSelectionState())

    act(() => {
      result.current.toggleRow('0')
      result.current.toggleRow('1')
      result.current.toggleRow('2')
    })

    expect(result.current.selectedCount).toBe(3)
    expect(result.current.selectedRowIds).toEqual(['0', '1', '2'])
  })

  it('single selection mode clears previous selection', () => {
    const { result } = renderHook(() =>
      useRowSelectionState({ enableMultiRowSelection: false })
    )

    act(() => result.current.toggleRow('0'))
    expect(result.current.selectedRowIds).toEqual(['0'])

    act(() => result.current.toggleRow('1'))
    expect(result.current.selectedRowIds).toEqual(['1'])
    expect(result.current.isSelected('0')).toBe(false)
  })

  it('toggleAll selects all provided row IDs', () => {
    const { result } = renderHook(() => useRowSelectionState())

    act(() => result.current.toggleAll(['0', '1', '2', '3']))
    expect(result.current.selectedCount).toBe(4)
  })

  it('toggleAll deselects all when all are selected', () => {
    const { result } = renderHook(() =>
      useRowSelectionState({ defaultSelection: { '0': true, '1': true } })
    )

    act(() => result.current.toggleAll(['0', '1']))
    expect(result.current.selectedCount).toBe(0)
  })

  it('clearSelection removes all selections', () => {
    const { result } = renderHook(() =>
      useRowSelectionState({ defaultSelection: { '0': true, '1': true, '2': true } })
    )

    act(() => result.current.clearSelection())
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.state).toEqual({})
  })

  it('isSelected returns correct boolean', () => {
    const { result } = renderHook(() =>
      useRowSelectionState({ defaultSelection: { '1': true } })
    )

    expect(result.current.isSelected('1')).toBe(true)
    expect(result.current.isSelected('0')).toBe(false)
    expect(result.current.isSelected('99')).toBe(false)
  })
})

// ─── useTable integration tests ───────────────────────────

type User = { id: number; name: string; age: number }

const testData: User[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  age: 20 + i,
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
])

describe('useTable row selection integration', () => {
  it('returns rowSelection when enabled', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, rowSelection: true })
    )

    expect(result.current.rowSelection).toBeDefined()
    expect(result.current.rowSelection.state).toEqual({})
    expect(result.current.rowSelection.selectedCount).toBe(0)
  })

  it('toggleRow selects a row through useTable', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, rowSelection: true })
    )

    act(() => result.current.rowSelection.toggleRow('0'))
    expect(result.current.rowSelection.isSelected('0')).toBe(true)
    expect(result.current.rowSelection.selectedCount).toBe(1)
  })

  it('toggleAll selects all visible rows', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, rowSelection: true })
    )

    act(() => result.current.rowSelection.toggleAll())
    expect(result.current.rowSelection.selectedCount).toBe(10)
  })

  it('clearSelection clears through useTable', () => {
    const { result } = renderHook(() =>
      useTable({
        data: testData,
        columns,
        rowSelection: { defaultSelection: { '0': true, '1': true } },
      })
    )

    expect(result.current.rowSelection.selectedCount).toBe(2)

    act(() => result.current.rowSelection.clearSelection())
    expect(result.current.rowSelection.selectedCount).toBe(0)
  })
})

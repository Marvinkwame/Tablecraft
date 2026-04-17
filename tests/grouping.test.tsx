import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGroupingState } from '../src/hooks/useGroupingState'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

// ─── Granular hook tests ──────────────────────────────────

describe('useGroupingState', () => {
  it('starts with empty grouping by default', () => {
    const { result } = renderHook(() => useGroupingState())
    expect(result.current.state).toEqual([])
    expect(result.current.groupedColumns).toEqual([])
    expect(result.current.isGrouped('category')).toBe(false)
  })

  it('accepts defaultGrouping', () => {
    const { result } = renderHook(() =>
      useGroupingState({ defaultGrouping: ['category', 'status'] })
    )
    expect(result.current.state).toEqual(['category', 'status'])
    expect(result.current.groupedColumns).toEqual(['category', 'status'])
    expect(result.current.isGrouped('category')).toBe(true)
    expect(result.current.isGrouped('status')).toBe(true)
    expect(result.current.isGrouped('name')).toBe(false)
  })

  it('toggleGrouping adds a column when not already grouped', () => {
    const { result } = renderHook(() => useGroupingState())

    act(() => result.current.toggleGrouping('category'))
    expect(result.current.state).toEqual(['category'])
    expect(result.current.isGrouped('category')).toBe(true)
  })

  it('toggleGrouping removes a column when already grouped', () => {
    const { result } = renderHook(() =>
      useGroupingState({ defaultGrouping: ['category', 'status'] })
    )

    act(() => result.current.toggleGrouping('category'))
    expect(result.current.state).toEqual(['status'])
    expect(result.current.isGrouped('category')).toBe(false)
    expect(result.current.isGrouped('status')).toBe(true)
  })

  it('multiple columns can be grouped simultaneously', () => {
    const { result } = renderHook(() => useGroupingState())

    act(() => result.current.toggleGrouping('category'))
    act(() => result.current.toggleGrouping('status'))
    act(() => result.current.toggleGrouping('region'))

    expect(result.current.state).toHaveLength(3)
    expect(result.current.isGrouped('category')).toBe(true)
    expect(result.current.isGrouped('status')).toBe(true)
    expect(result.current.isGrouped('region')).toBe(true)
  })

  it('setGrouping replaces the entire grouping state', () => {
    const { result } = renderHook(() =>
      useGroupingState({ defaultGrouping: ['category'] })
    )

    act(() => result.current.setGrouping(['name', 'price']))
    expect(result.current.state).toEqual(['name', 'price'])
    expect(result.current.isGrouped('category')).toBe(false)
    expect(result.current.isGrouped('name')).toBe(true)
  })

  it('clearGrouping resets to empty array', () => {
    const { result } = renderHook(() =>
      useGroupingState({ defaultGrouping: ['category', 'status'] })
    )

    act(() => result.current.clearGrouping())
    expect(result.current.state).toEqual([])
    expect(result.current.groupedColumns).toEqual([])
  })

  it('isGrouped returns correct boolean for each column', () => {
    const { result } = renderHook(() =>
      useGroupingState({ defaultGrouping: ['category'] })
    )

    expect(result.current.isGrouped('category')).toBe(true)
    expect(result.current.isGrouped('name')).toBe(false)
    expect(result.current.isGrouped('price')).toBe(false)
  })

  it('groupedColumns matches state', () => {
    const { result } = renderHook(() =>
      useGroupingState({ defaultGrouping: ['a', 'b', 'c'] })
    )

    expect(result.current.groupedColumns).toEqual(result.current.state)
  })
})

// ─── useTable integration tests ───────────────────────────

type Product = { id: number; category: string; name: string; price: number }

const products: Product[] = [
  { id: 1, category: 'Electronics', name: 'Phone',  price: 699 },
  { id: 2, category: 'Electronics', name: 'Tablet', price: 499 },
  { id: 3, category: 'Clothing',    name: 'Shirt',  price: 29  },
  { id: 4, category: 'Clothing',    name: 'Pants',  price: 59  },
  { id: 5, category: 'Electronics', name: 'Laptop', price: 999 },
]

const columns = createColumns<Product>([
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'name',     header: 'Name' },
  { accessorKey: 'price',    header: 'Price', aggregationFn: 'sum' },
])

describe('useTable grouping integration', () => {
  it('grouped row model has correct number of groups', () => {
    const { result } = renderHook(() =>
      useTable({
        data: products,
        columns,
        grouping: { defaultGrouping: ['category'] },
        pagination: false,
      })
    )

    const rows = result.current.table.getRowModel().rows
    // 2 groups: Electronics, Clothing
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.getIsGrouped())).toBe(true)
  })

  it('leaf rows are accessible under each group', () => {
    const { result } = renderHook(() =>
      useTable({
        data: products,
        columns,
        grouping: { defaultGrouping: ['category'] },
        pagination: false,
      })
    )

    const rows = result.current.table.getRowModel().rows
    const totalLeafs = rows.reduce((sum, r) => sum + r.subRows.length, 0)
    expect(totalLeafs).toBe(5)
  })

  it('aggregated values are present on grouped rows', () => {
    const { result } = renderHook(() =>
      useTable({
        data: products,
        columns,
        grouping: { defaultGrouping: ['category'] },
        pagination: false,
      })
    )

    const rows = result.current.table.getRowModel().rows
    // Both groups should have aggregated price values
    rows.forEach((row) => {
      const priceCell = row.getAllCells().find((c) => c.column.id === 'price')
      expect(priceCell?.getIsAggregated()).toBe(true)
    })
  })

  it('toggleGrouping via hook updates the row model', () => {
    const { result } = renderHook(() =>
      useTable({
        data: products,
        columns,
        grouping: true,
        pagination: false,
      })
    )

    // Initially flat
    expect(result.current.table.getRowModel().rows).toHaveLength(5)

    // Group by category
    act(() => result.current.grouping.toggleGrouping('category'))
    expect(result.current.table.getRowModel().rows).toHaveLength(2)
  })

  it('clearGrouping restores flat row model', () => {
    const { result } = renderHook(() =>
      useTable({
        data: products,
        columns,
        grouping: { defaultGrouping: ['category'] },
        pagination: false,
      })
    )

    expect(result.current.table.getRowModel().rows).toHaveLength(2)

    act(() => result.current.grouping.clearGrouping())
    expect(result.current.table.getRowModel().rows).toHaveLength(5)
  })

  it('grouped rows can be expanded via rowExpansion', () => {
    const { result } = renderHook(() =>
      useTable({
        data: products,
        columns,
        grouping: { defaultGrouping: ['category'] },
        rowExpansion: true,
        pagination: false,
      })
    )

    const rows = result.current.table.getRowModel().rows
    const firstGroupRowId = rows[0].id

    // Expand the first group
    act(() => result.current.rowExpansion.expandRow(firstGroupRowId))
    expect(result.current.rowExpansion.isExpanded(firstGroupRowId)).toBe(true)

    // Collapse it
    act(() => result.current.rowExpansion.collapseRow(firstGroupRowId))
    expect(result.current.rowExpansion.isExpanded(firstGroupRowId)).toBe(false)
  })
})

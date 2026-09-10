import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

type Product = { id: number; status: string; price: number }

const products: Product[] = [
  { id: 1, status: 'Active', price: 10 },
  { id: 2, status: 'Active', price: 20 },
  { id: 3, status: 'Archived', price: 30 },
]

const columns = createColumns<Product>([
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'price', header: 'Price' },
])

function renderProductTable() {
  return renderHook(() => useTable({ data: products, columns, pagination: false }))
}

describe('useTable — faceted row models', () => {
  it('reports faceted unique values with counts', () => {
    const { result } = renderProductTable()
    const status = result.current.table.getColumn('status')!

    expect(status.getFacetedUniqueValues()).toEqual(
      new Map([['Active', 2], ['Archived', 1]])
    )
  })

  it('reports faceted min and max for a numeric column', () => {
    const { result } = renderProductTable()
    const price = result.current.table.getColumn('price')!

    expect(price.getFacetedMinMaxValues()).toEqual([10, 30])
  })

  it('exposes a faceted row model containing every row when nothing is filtered', () => {
    const { result } = renderProductTable()
    const status = result.current.table.getColumn('status')!

    expect(status.getFacetedRowModel().rows).toHaveLength(3)
  })
})

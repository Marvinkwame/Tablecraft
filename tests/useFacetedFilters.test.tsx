import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { useFacetedFilters } from '../src/hooks/useFacetedFilters'
import { createColumns } from '../src/helpers/createColumns'

type Product = {
  id: number
  name: string
  status: string
  category: string
  price: number
}

const products: Product[] = [
  { id: 1, name: 'Alpha',   status: 'Active',   category: 'A', price: 10 },
  { id: 2, name: 'Bravo',   status: 'Active',   category: 'A', price: 20 },
  { id: 3, name: 'Charlie', status: 'Active',   category: 'B', price: 30 },
  { id: 4, name: 'Delta',   status: 'Archived', category: 'A', price: 40 },
  { id: 5, name: 'Echo',    status: 'Archived', category: 'B', price: 50 },
  { id: 6, name: 'Foxtrot', status: 'Pending',  category: 'A', price: 60 },
]

const productColumns = createColumns<Product>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status', filterFn: 'arrIncludesSome' },
  { accessorKey: 'category', header: 'Category', filterFn: 'arrIncludesSome' },
  { accessorKey: 'price', header: 'Price', filterFn: 'inNumberRange' },
])

function renderFacets() {
  return renderHook(() => {
    const tableReturn = useTable({ data: products, columns: productColumns, pagination: false })
    return { ...tableReturn, facets: useFacetedFilters(tableReturn.table) }
  })
}

describe('useFacetedFilters — options', () => {
  it('returns every distinct value with its count, count-descending', () => {
    const { result } = renderFacets()

    expect(
      result.current.facets.getFacet('status').options.map((o) => [o.value, o.count])
    ).toEqual([['Active', 3], ['Archived', 2], ['Pending', 1]])
  })

  it('reports nothing selected initially', () => {
    const { result } = renderFacets()
    const facet = result.current.facets.getFacet('status')

    expect(facet.selected).toEqual([])
    expect(facet.options.every((o) => o.selected === false)).toBe(true)
  })
})

describe('useFacetedFilters — selection', () => {
  it('toggle applies a filter and narrows the table', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(result.current.facets.getFacet('status').selected).toEqual(['Active'])
    expect(result.current.table.getRowModel().rows).toHaveLength(3)
  })

  it('toggle accumulates a second value', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getFacet('status').toggle('Active'))
    act(() => result.current.facets.getFacet('status').toggle('Pending'))

    expect(result.current.facets.getFacet('status').selected).toEqual(['Active', 'Pending'])
    expect(result.current.table.getRowModel().rows).toHaveLength(4)
  })

  it('isSelected and option.selected agree with the filter', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getFacet('status').toggle('Archived'))

    const facet = result.current.facets.getFacet('status')
    expect(facet.isSelected('Archived')).toBe(true)
    expect(facet.isSelected('Active')).toBe(false)
    expect(facet.options.find((o) => o.value === 'Archived')!.selected).toBe(true)
  })

  it('deselecting the last value restores every row rather than blanking the table', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getFacet('status').toggle('Active'))
    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(result.current.facets.getFacet('status').selected).toEqual([])
    expect(result.current.table.getRowModel().rows).toHaveLength(6)
  })

  it('removes the filter entry entirely instead of leaving an empty array', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getFacet('status').toggle('Active'))
    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(result.current.table.getState().columnFilters).toEqual([])
  })

  it('clear removes the filter and restores every row', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getFacet('status').toggle('Active'))
    act(() => result.current.facets.getFacet('status').clear())

    expect(result.current.table.getState().columnFilters).toEqual([])
    expect(result.current.table.getRowModel().rows).toHaveLength(6)
  })

  it('reads a selection set directly through columnFilters.setFilter', () => {
    const { result } = renderFacets()

    act(() => result.current.columnFilters.setFilter('status', ['Pending']))

    expect(result.current.facets.getFacet('status').selected).toEqual(['Pending'])
  })
})

describe('useFacetedFilters — the faceted row model', () => {
  it('leaves a facet own counts unchanged when its own value is toggled', () => {
    const { result } = renderFacets()
    const before = result.current.facets.getFacet('status').options.map((o) => [o.value, o.count])

    act(() => result.current.facets.getFacet('status').toggle('Active'))

    // A facet excludes its own filter, so the other options stay clickable.
    // Reading getFilteredRowModel() instead would give Active 3, Archived 0, Pending 0.
    expect(
      result.current.facets.getFacet('status').options.map((o) => [o.value, o.count])
    ).toEqual(before)
  })

  it('updates a facet counts when a DIFFERENT column is filtered', () => {
    const { result } = renderFacets()

    expect(
      result.current.facets.getFacet('category').options.map((o) => [o.value, o.count])
    ).toEqual([['A', 4], ['B', 2]])

    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(
      result.current.facets.getFacet('category').options.map((o) => [o.value, o.count])
    ).toEqual([['A', 2], ['B', 1]])
  })
})

describe('useFacetedFilters — unknown column', () => {
  it('returns an empty facet rather than throwing', () => {
    const { result } = renderFacets()
    const facet = result.current.facets.getFacet('nope')

    expect(facet.options).toEqual([])
    expect(facet.selected).toEqual([])
    expect(facet.isSelected('anything')).toBe(false)
  })

  it('has no-op handlers that do not touch the filters', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getFacet('nope').toggle('x'))
    act(() => result.current.facets.getFacet('nope').clear())

    expect(result.current.table.getState().columnFilters).toEqual([])
  })
})

describe('useFacetedFilters — server tables', () => {
  it('returns empty facets when the table holds one page', () => {
    const { result } = renderHook(() => {
      const tableReturn = useTable({
        data: products,
        columns: productColumns,
        manualPagination: true,
        rowCount: 100,
      })
      return { ...tableReturn, facets: useFacetedFilters(tableReturn.table) }
    })

    // Page-scoped counts would look plausible and be wrong, so return nothing.
    expect(result.current.facets.getFacet('status').options).toEqual([])
  })
})

describe('useFacetedFilters — range facets', () => {
  it('reports the true min and max of the column', () => {
    const { result } = renderFacets()
    const price = result.current.facets.getRangeFacet('price')

    expect([price.min, price.max]).toEqual([10, 60])
  })

  it('reports no applied range initially', () => {
    const { result } = renderFacets()
    expect(result.current.facets.getRangeFacet('price').value).toBeUndefined()
  })

  it('setRange applies the range and narrows the table', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getRangeFacet('price').setRange([20, 40]))

    expect(result.current.facets.getRangeFacet('price').value).toEqual([20, 40])
    expect(
      result.current.table.getRowModel().rows.map((r) => r.original.price)
    ).toEqual([20, 30, 40])
  })

  it('setRange(undefined) removes the filter entry', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getRangeFacet('price').setRange([20, 40]))
    act(() => result.current.facets.getRangeFacet('price').setRange(undefined))

    expect(result.current.table.getState().columnFilters).toEqual([])
    expect(result.current.table.getRowModel().rows).toHaveLength(6)
  })

  it('clear removes the filter entry', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getRangeFacet('price').setRange([20, 40]))
    act(() => result.current.facets.getRangeFacet('price').clear())

    expect(result.current.table.getState().columnFilters).toEqual([])
  })

  it('min and max ignore the column own range filter', () => {
    const { result } = renderFacets()

    act(() => result.current.facets.getRangeFacet('price').setRange([20, 40]))

    // Bounds must stay stable or a slider would collapse onto its own selection.
    const price = result.current.facets.getRangeFacet('price')
    expect([price.min, price.max]).toEqual([10, 60])
  })

  it('returns undefined bounds for a non-numeric column', () => {
    const { result } = renderFacets()
    const status = result.current.facets.getRangeFacet('status')

    expect([status.min, status.max]).toEqual([undefined, undefined])
  })

  it('getFacet on a numeric column yields one option per distinct number', () => {
    const { result } = renderFacets()

    // The two accessors are independent; mismatching them is inert, not an error.
    expect(
      result.current.facets.getFacet('price').options.map((o) => o.value)
    ).toEqual([10, 20, 30, 40, 50, 60])
  })

  it('returns undefined bounds for an unknown column and does not throw', () => {
    const { result } = renderFacets()
    const facet = result.current.facets.getRangeFacet('nope')

    expect([facet.min, facet.max]).toEqual([undefined, undefined])
    act(() => facet.setRange([1, 2]))
    expect(result.current.table.getState().columnFilters).toEqual([])
  })

  it('ignores a two-element non-numeric filter rather than reporting it as a range', () => {
    const { result } = renderFacets()

    // Two selected string values leave a 2-element array on the column.
    act(() => result.current.facets.getFacet('status').toggle('Active'))
    act(() => result.current.facets.getFacet('status').toggle('Pending'))

    expect(result.current.facets.getRangeFacet('status').value).toBeUndefined()
  })
})

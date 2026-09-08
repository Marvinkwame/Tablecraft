import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockInstance } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { useFacetedFilters } from '../src/hooks/useFacetedFilters'
import { facetedFilterFn } from '../src/utils/facets'
import { createColumns } from '../src/helpers/createColumns'

type Row = { id: number; status: string; price: number }

const rows: Row[] = [
  { id: 1, status: 'Active', price: 10 },
  { id: 2, status: 'Archived', price: 20 },
]

let warn: MockInstance<Parameters<typeof console.warn>, void>

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

function renderWith(columns: ReturnType<typeof createColumns<Row>>, options = {}) {
  return renderHook(() => {
    const tableReturn = useTable({ data: rows, columns, pagination: false, ...options })
    return { ...tableReturn, facets: useFacetedFilters(tableReturn.table) }
  })
}

describe('useFacetedFilters — filterFn warnings', () => {
  it('warns when toggling a column with no filterFn', () => {
    const columns = createColumns<Row>([
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'price', header: 'Price' },
    ])
    const { result } = renderWith(columns)

    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('facetedFilterFn')
    expect(String(warn.mock.calls[0][0])).toContain('status')
  })

  it('warns only once per column however many times you toggle', () => {
    const columns = createColumns<Row>([
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'price', header: 'Price' },
    ])
    const { result } = renderWith(columns)

    act(() => result.current.facets.getFacet('status').toggle('Active'))
    act(() => result.current.facets.getFacet('status').toggle('Archived'))
    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does not warn for facetedFilterFn', () => {
    const columns = createColumns<Row>([
      { accessorKey: 'status', header: 'Status', filterFn: facetedFilterFn },
      { accessorKey: 'price', header: 'Price' },
    ])
    const { result } = renderWith(columns)

    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(warn).not.toHaveBeenCalled()
  })

  it('does not warn for a custom filter function', () => {
    const columns = createColumns<Row>([
      { accessorKey: 'status', header: 'Status', filterFn: () => true },
      { accessorKey: 'price', header: 'Price' },
    ])
    const { result } = renderWith(columns)

    act(() => result.current.facets.getFacet('status').toggle('Active'))

    expect(warn).not.toHaveBeenCalled()
  })

  it('does not warn merely from reading a facet', () => {
    const columns = createColumns<Row>([
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'price', header: 'Price' },
    ])
    const { result } = renderWith(columns)

    result.current.facets.getFacet('status').options

    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when setting a range on a column without inNumberRange', () => {
    const columns = createColumns<Row>([
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'price', header: 'Price' },
    ])
    const { result } = renderWith(columns)

    act(() => result.current.facets.getRangeFacet('price').setRange([10, 20]))

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('inNumberRange')
  })
})

describe('useFacetedFilters — structural warnings', () => {
  it('warns once for an unknown column id', () => {
    const columns = createColumns<Row>([{ accessorKey: 'status', header: 'Status' }])
    const { result } = renderWith(columns)

    result.current.facets.getFacet('nope')
    result.current.facets.getFacet('nope')

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('nope')
  })

  it('warns once when the table is server-backed', () => {
    const columns = createColumns<Row>([
      { accessorKey: 'status', header: 'Status', filterFn: facetedFilterFn },
    ])
    const { result } = renderWith(columns, { manualPagination: true, rowCount: 99 })

    result.current.facets.getFacet('status')
    result.current.facets.getFacet('status')

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('full dataset')
  })
})

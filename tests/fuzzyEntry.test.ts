import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { fuzzyFilterFn } from '../fuzzy'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

type Row = { id: number; name: string }

const data: Row[] = [
  { id: 1, name: 'Jonathan' },
  { id: 2, name: 'Marguerite' },
]

const columns = createColumns<Row>([{ accessorKey: 'name', header: 'Name' }])

function renderFuzzy() {
  return renderHook(() =>
    useTable({ data, columns, pagination: false, globalFilter: true, fuzzy: fuzzyFilterFn })
  )
}

const names = (result: ReturnType<typeof renderFuzzy>['result']) =>
  result.current.table.getRowModel().rows.map((r) => r.original.name)

describe('fuzzyFilterFn', () => {
  it('matches despite a typo', () => {
    const { result } = renderFuzzy()

    act(() => result.current.globalFilter.setValue('jonathn'))

    expect(names(result)).toEqual(['Jonathan'])
  })

  it('matches everything for an empty search', () => {
    const { result } = renderFuzzy()

    act(() => result.current.globalFilter.setValue('jonathn'))
    act(() => result.current.globalFilter.setValue(''))

    expect(names(result)).toEqual(['Jonathan', 'Marguerite'])
  })

  it('does not match an unrelated search', () => {
    const { result } = renderFuzzy()

    act(() => result.current.globalFilter.setValue('zzzz'))

    expect(names(result)).toEqual([])
  })
})

describe('fuzzyFilterFn types', () => {
  it('does not collapse the TData inference of useTable', () => {
    // fuzzyFilterFn is declared generic rather than annotated
    // FilterFn<TablecraftFeatures, any>. FilterFn is `in out` in TData, so a
    // fixed `any` pins inference and a consumer's typed columns stop fitting —
    // this file failed to compile that way. The body never runs; tsc is the
    // assertion, and `r.original.name` is what would stop resolving.
    const check = () => {
      const { table } = useTable({ data, columns, fuzzy: fuzzyFilterFn })
      return table.getRowModel().rows.map((r) => r.original.name.toUpperCase())
    }
    expect(typeof check).toBe('function')
  })
})

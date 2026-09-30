import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTable } from '../src/hooks/useTable'
import { useQueryTable } from '../src/hooks/useQueryTable'
import { createColumns } from '../src/helpers/createColumns'

/**
 * A hook must never write into the options object its caller passed in.
 *
 * `useTable` and `useQueryTable` fold persisted and URL state into their
 * resolved pagination/sorting config. Where that config aliases the caller's
 * object rather than copying it, the fold mutates the caller's object — which
 * is observable, survives the render, and leaks between tables sharing a
 * module-scope options constant.
 *
 * This is the same class of bug fixed in useColumnPinningState for 4.1.0.
 */

type Row = { id: number; name: string }

const data: Row[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

const columns = createColumns<Row>([{ accessorKey: 'name', header: 'Name' }])

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useTable — does not mutate caller options', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'tablecraft:mutation-probe',
      JSON.stringify({ sorting: [{ id: 'name', desc: true }] })
    )
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('does not write defaultSort into the sorting options object', () => {
    const sortingOpts = {}

    renderHook(() =>
      useTable({
        data,
        columns,
        sorting: sortingOpts,
        persist: 'localStorage',
        persistKey: 'mutation-probe',
      })
    )

    expect(sortingOpts).toEqual({})
  })

  it('does not leak persisted sort between two tables sharing one options object', () => {
    // The failure mode that makes this more than cosmetic: a module-scope
    // options constant reused across tables carries the first table's
    // persisted sort into the second, which never asked for it.
    const shared = {}

    renderHook(() =>
      useTable({
        data,
        columns,
        sorting: shared,
        persist: 'localStorage',
        persistKey: 'mutation-probe',
      })
    )

    const { result } = renderHook(() =>
      useTable({ data, columns, sorting: shared })
    )

    expect(result.current.sorting.sortingState).toEqual([])
  })

  it('does not write pageIndex or pageSize into the pagination options object', () => {
    localStorage.setItem(
      'tablecraft:mutation-probe',
      JSON.stringify({ pagination: { pageIndex: 3, pageSize: 50 } })
    )
    const paginationOpts = {}

    renderHook(() =>
      useTable({
        data,
        columns,
        pagination: paginationOpts,
        persist: 'localStorage',
        persistKey: 'mutation-probe',
        // pagination is not persisted by default — opt in, or this test
        // passes vacuously because nothing is ever folded into the config.
        persistOptions: { pagination: true },
      })
    )

    expect(paginationOpts).toEqual({})
  })
})

describe('useQueryTable — does not mutate caller options', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('does not write defaultSort into the sorting options object', async () => {
    localStorage.setItem(
      'tablecraft:query-mutation-probe',
      JSON.stringify({ sorting: [{ id: 'name', desc: true }] })
    )
    const sortingOpts = {}
    const queryFn = vi.fn().mockResolvedValue({ data, rowCount: 2 })

    renderHook(
      () =>
        useQueryTable({
          queryKey: ['mutation-sorting'],
          queryFn,
          columns,
          sorting: sortingOpts,
          persist: 'localStorage',
          persistKey: 'query-mutation-probe',
        }),
      { wrapper: createWrapper() }
    )

    expect(sortingOpts).toEqual({})
  })

  it('does not write pageIndex or pageSize into the pagination options object', async () => {
    localStorage.setItem(
      'tablecraft:query-mutation-probe',
      JSON.stringify({ pagination: { pageIndex: 3, pageSize: 50 } })
    )
    const paginationOpts = {}
    const queryFn = vi.fn().mockResolvedValue({ data, rowCount: 2 })

    renderHook(
      () =>
        useQueryTable({
          queryKey: ['mutation-pagination'],
          queryFn,
          columns,
          pagination: paginationOpts,
          persist: 'localStorage',
          persistKey: 'query-mutation-probe',
          persistOptions: { pagination: true },
        }),
      { wrapper: createWrapper() }
    )

    expect(paginationOpts).toEqual({})
  })
})

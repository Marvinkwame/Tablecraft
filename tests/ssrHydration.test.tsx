import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { render } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

/**
 * Persisted and URL state are browser-only. Reading them during render makes
 * the first client render differ from the server HTML, which is a React
 * hydration mismatch — and `'use client'` does not prevent a component from
 * rendering on the server.
 *
 * The fix must satisfy BOTH halves:
 *
 *   - Server / hydration render: ignore stored state, so the markup matches
 *     what the server produced.
 *   - Client-only render: apply stored state immediately, so a CSR app does
 *     not flash unsorted content for a frame.
 *
 * `renderToString` exercises the first; Testing Library's `render` (a plain
 * client root) exercises the second.
 */

type Row = { id: number; name: string }

const data: Row[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Carol' },
]

const columns = createColumns<Row>([{ accessorKey: 'name', header: 'Name' }])

function Table() {
  const { table } = useTable({
    data,
    columns,
    sorting: true,
    pagination: false,
    persist: 'localStorage',
    persistKey: 'ssr-hydration',
  })
  return (
    <ul>
      {table.getRowModel().rows.map((r) => (
        <li key={r.id}>{r.original.name}</li>
      ))}
    </ul>
  )
}

describe('SSR hydration — persisted state', () => {
  beforeEach(() => {
    localStorage.clear()
    // The user sorted by name descending on their last visit.
    localStorage.setItem(
      'tablecraft:ssr-hydration',
      JSON.stringify({ sorting: [{ id: 'name', desc: true }] })
    )
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('server render ignores persisted state, so hydration cannot mismatch', () => {
    const html = renderToString(<Table />)

    // Natural data order — NOT the persisted descending sort. If this picks up
    // localStorage, the server HTML disagrees with what the server could
    // possibly know, and React reports a hydration mismatch on the client.
    expect(html).toBe('<ul><li>Alice</li><li>Bob</li><li>Carol</li></ul>')
  })

  it('client-only render applies persisted state on the first paint', () => {
    const { container } = render(<Table />)

    // No flash of unsorted content: a CSR app must get the saved sort
    // immediately, not one frame later.
    expect(container.querySelector('ul')!.textContent).toBe('CarolBobAlice')
  })
})

describe('SSR hydration — the full server-then-hydrate cycle', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'tablecraft:ssr-hydration',
      JSON.stringify({ sorting: [{ id: 'name', desc: true }] })
    )
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('hydrates without a mismatch, then restores the stored sort', async () => {
    const { hydrateRoot } = await import('react-dom/client')
    const { act } = await import('@testing-library/react')

    const serverHTML = renderToString(<Table />)
    const host = document.createElement('div')
    host.innerHTML = serverHTML
    document.body.appendChild(host)

    const errors: unknown[] = []
    const realError = console.error
    console.error = (...args: unknown[]) => { errors.push(args[0]) }

    await act(async () => {
      hydrateRoot(host, <Table />)
    })

    console.error = realError
    document.body.removeChild(host)

    // React reports a hydration mismatch through console.error.
    const mismatch = errors.filter(
      (e) => typeof e === 'string' && /hydrat/i.test(e)
    )
    expect(mismatch).toEqual([])

    // And the stored sort is applied once hydration is done.
    expect(host.querySelector('ul')!.textContent).toBe('CarolBobAlice')
  })

  it('never writes empty defaults over stored state, even transiently', async () => {
    const { hydrateRoot } = await import('react-dom/client')
    const { act } = await import('@testing-library/react')

    // The final value self-heals — the save effect re-runs once the restored
    // state lands — so asserting on the end state proves nothing. What matters
    // is that storage never transiently holds the pre-restore defaults: a user
    // closing the tab inside that window would lose their saved sort.
    const writes: string[] = []
    const realSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'tablecraft:ssr-hydration') writes.push(value)
      return realSetItem.call(this, key, value)
    }

    const host = document.createElement('div')
    host.innerHTML = renderToString(<Table />)
    document.body.appendChild(host)

    await act(async () => {
      hydrateRoot(host, <Table />)
    })

    Storage.prototype.setItem = realSetItem
    document.body.removeChild(host)

    const wroteEmptySort = writes.some((w) => {
      const sorting = JSON.parse(w).sorting
      return Array.isArray(sorting) && sorting.length === 0
    })
    expect(wroteEmptySort).toBe(false)
  })
})

describe('SSR hydration — useQueryTable', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'tablecraft:ssr-query',
      JSON.stringify({ sorting: [{ id: 'name', desc: true }] })
    )
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('server render ignores persisted state', async () => {
    const { useQueryTable } = await import('../src/hooks/useQueryTable')
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')

    function QueryTable() {
      const { sorting } = useQueryTable({
        queryKey: ['ssr'],
        queryFn: async () => ({ data, rowCount: data.length }),
        columns,
        persist: 'localStorage',
        persistKey: 'ssr-query',
      })
      return <span>{JSON.stringify(sorting.sortingState)}</span>
    }

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const html = renderToString(
      <QueryClientProvider client={client}>
        <QueryTable />
      </QueryClientProvider>
    )

    // Not the persisted descending sort — the server cannot know it.
    expect(html).toContain('[]')
  })
})

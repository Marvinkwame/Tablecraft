import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useColumnPinningState } from '../src/hooks/useColumnPinningState'
import { useTable } from '../src/hooks/useTable'
import { useQueryTable } from '../src/hooks/useQueryTable'
import { useInfiniteTable } from '../src/hooks/useInfiniteTable'
import { createColumns } from '../src/helpers/createColumns'

// ─── Shared test data ─────────────────────────────────────

type Row = { id: number; name: string; email: string }

const columns = createColumns<Row>([
  { accessorKey: 'id',    header: 'ID' },
  { accessorKey: 'name',  header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
])

const testData: Row[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob',   email: 'bob@test.com' },
]

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ─── useColumnPinningState unit tests ─────────────────────

describe('useColumnPinningState', () => {
  it('starts with empty pinning state by default', () => {
    const { result } = renderHook(() => useColumnPinningState())
    expect(result.current.state).toEqual({ start: [], end: [] })
    expect(result.current.startColumns).toEqual([])
    expect(result.current.endColumns).toEqual([])
  })

  it('pinStart adds column to start group', () => {
    const { result } = renderHook(() => useColumnPinningState())
    act(() => result.current.pinStart('name'))
    expect(result.current.startColumns).toContain('name')
    expect(result.current.endColumns).not.toContain('name')
  })

  it('pinEnd adds column to end group', () => {
    const { result } = renderHook(() => useColumnPinningState())
    act(() => result.current.pinEnd('email'))
    expect(result.current.endColumns).toContain('email')
    expect(result.current.startColumns).not.toContain('email')
  })

  it('unpin removes column from start group', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { start: ['name'], end: [] } })
    )
    act(() => result.current.unpin('name'))
    expect(result.current.startColumns).not.toContain('name')
  })

  it('clearPinning removes all pins', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { start: ['id'], end: ['email'] } })
    )
    act(() => result.current.clearPinning())
    expect(result.current.startColumns).toHaveLength(0)
    expect(result.current.endColumns).toHaveLength(0)
  })

  it('isPinned returns correct position', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { start: ['id'], end: ['email'] } })
    )
    expect(result.current.isPinned('id')).toBe('start')
    expect(result.current.isPinned('email')).toBe('end')
    expect(result.current.isPinned('name')).toBe(false)
  })

  it('startColumns and endColumns reflect state', () => {
    const { result } = renderHook(() => useColumnPinningState())
    act(() => {
      result.current.pinStart('id')
      result.current.pinEnd('email')
    })
    expect(result.current.startColumns).toEqual(['id'])
    expect(result.current.endColumns).toEqual(['email'])
  })

  it('defaultPinning option seeds initial state', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { start: ['id'], end: ['email'] } })
    )
    expect(result.current.startColumns).toEqual(['id'])
    expect(result.current.endColumns).toEqual(['email'])
  })

  it('pinStart removes column from end group when moving sides', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { start: [], end: ['name'] } })
    )
    expect(result.current.endColumns).toContain('name')
    act(() => result.current.pinStart('name'))
    expect(result.current.startColumns).toContain('name')
    expect(result.current.endColumns).not.toContain('name')
  })
})

// ─── useColumnPinningState — logical start/end pinning ────

describe('useColumnPinningState — logical start/end pinning', () => {
  it('pins a column to the start', () => {
    const { result } = renderHook(() => useColumnPinningState())

    act(() => result.current.pinStart('name'))

    expect(result.current.startColumns).toEqual(['name'])
    expect(result.current.endColumns).toEqual([])
    expect(result.current.isPinned('name')).toBe('start')
  })

  it('pins a column to the end', () => {
    const { result } = renderHook(() => useColumnPinningState())

    act(() => result.current.pinEnd('actions'))

    expect(result.current.endColumns).toEqual(['actions'])
    expect(result.current.isPinned('actions')).toBe('end')
  })

  it('moves a column from start to end without duplicating it', () => {
    const { result } = renderHook(() => useColumnPinningState())

    act(() => result.current.pinStart('name'))
    act(() => result.current.pinEnd('name'))

    expect(result.current.startColumns).toEqual([])
    expect(result.current.endColumns).toEqual(['name'])
  })

  it('unpins a column', () => {
    const { result } = renderHook(() => useColumnPinningState())

    act(() => result.current.pinStart('name'))
    act(() => result.current.unpin('name'))

    expect(result.current.startColumns).toEqual([])
    expect(result.current.isPinned('name')).toBe(false)
  })

  it('clears all pinning', () => {
    const { result } = renderHook(() => useColumnPinningState())

    act(() => result.current.pinStart('name'))
    act(() => result.current.pinEnd('actions'))
    act(() => result.current.clearPinning())

    expect(result.current.startColumns).toEqual([])
    expect(result.current.endColumns).toEqual([])
  })
})

// ─── useTable integration tests ───────────────────────────

describe('useTable column pinning integration', () => {
  it('columnPinning disabled by default — state is empty', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )
    expect(result.current.columnPinning.state).toEqual({ start: [], end: [] })
    expect(result.current.columnPinning.startColumns).toEqual([])
  })

  it('pinStart wires through to TanStack table state', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, columnPinning: true })
    )
    act(() => result.current.columnPinning.pinStart('name'))
    expect(result.current.columnPinning.startColumns).toContain('name')
    expect(result.current.table.getState().columnPinning.start).toContain('name')
  })
})

// ─── useQueryTable smoke test ─────────────────────────────

describe('useQueryTable column pinning smoke test', () => {
  it('columnPinning works in useQueryTable', async () => {
    const queryFn = async () => ({ data: testData, rowCount: 2 })
    const { result } = renderHook(
      () => useQueryTable({
        queryKey: ['smoke-pin'],
        queryFn,
        columns,
        columnPinning: true,
      }),
      { wrapper: createQueryWrapper() }
    )
    act(() => result.current.columnPinning.pinEnd('email'))
    expect(result.current.columnPinning.endColumns).toContain('email')
  })
})

// ─── useInfiniteTable smoke test ──────────────────────────

describe('useInfiniteTable column pinning smoke test', () => {
  it('columnPinning works in useInfiniteTable', () => {
    const queryFn = async () => ({ data: testData, nextCursor: undefined })
    const { result } = renderHook(
      () => useInfiniteTable({
        queryKey: ['smoke-pin-infinite'],
        queryFn,
        columns,
        columnPinning: true,
      }),
      { wrapper: createQueryWrapper() }
    )
    act(() => result.current.columnPinning.pinStart('id'))
    expect(result.current.columnPinning.startColumns).toContain('id')
  })
})

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
    expect(result.current.state).toEqual({ left: [], right: [] })
    expect(result.current.leftColumns).toEqual([])
    expect(result.current.rightColumns).toEqual([])
  })

  it('pinLeft adds column to left group', () => {
    const { result } = renderHook(() => useColumnPinningState())
    act(() => result.current.pinLeft('name'))
    expect(result.current.leftColumns).toContain('name')
    expect(result.current.rightColumns).not.toContain('name')
  })

  it('pinRight adds column to right group', () => {
    const { result } = renderHook(() => useColumnPinningState())
    act(() => result.current.pinRight('email'))
    expect(result.current.rightColumns).toContain('email')
    expect(result.current.leftColumns).not.toContain('email')
  })

  it('unpin removes column from left group', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { left: ['name'], right: [] } })
    )
    act(() => result.current.unpin('name'))
    expect(result.current.leftColumns).not.toContain('name')
  })

  it('clearPinning removes all pins', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { left: ['id'], right: ['email'] } })
    )
    act(() => result.current.clearPinning())
    expect(result.current.leftColumns).toHaveLength(0)
    expect(result.current.rightColumns).toHaveLength(0)
  })

  it('isPinned returns correct position', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { left: ['id'], right: ['email'] } })
    )
    expect(result.current.isPinned('id')).toBe('left')
    expect(result.current.isPinned('email')).toBe('right')
    expect(result.current.isPinned('name')).toBe(false)
  })

  it('leftColumns and rightColumns reflect state', () => {
    const { result } = renderHook(() => useColumnPinningState())
    act(() => {
      result.current.pinLeft('id')
      result.current.pinRight('email')
    })
    expect(result.current.leftColumns).toEqual(['id'])
    expect(result.current.rightColumns).toEqual(['email'])
  })

  it('defaultPinning option seeds initial state', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { left: ['id'], right: ['email'] } })
    )
    expect(result.current.leftColumns).toEqual(['id'])
    expect(result.current.rightColumns).toEqual(['email'])
  })

  it('pinLeft removes column from right group when moving sides', () => {
    const { result } = renderHook(() =>
      useColumnPinningState({ defaultPinning: { left: [], right: ['name'] } })
    )
    expect(result.current.rightColumns).toContain('name')
    act(() => result.current.pinLeft('name'))
    expect(result.current.leftColumns).toContain('name')
    expect(result.current.rightColumns).not.toContain('name')
  })
})

// ─── useTable integration tests ───────────────────────────

describe('useTable column pinning integration', () => {
  it('columnPinning disabled by default — state is empty', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns })
    )
    expect(result.current.columnPinning.state).toEqual({ left: [], right: [] })
    expect(result.current.columnPinning.leftColumns).toEqual([])
  })

  it('pinLeft wires through to TanStack table state', () => {
    const { result } = renderHook(() =>
      useTable({ data: testData, columns, columnPinning: true })
    )
    act(() => result.current.columnPinning.pinLeft('name'))
    expect(result.current.columnPinning.leftColumns).toContain('name')
    expect(result.current.table.getState().columnPinning.left).toContain('name')
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
    act(() => result.current.columnPinning.pinRight('email'))
    expect(result.current.columnPinning.rightColumns).toContain('email')
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
    act(() => result.current.columnPinning.pinLeft('id'))
    expect(result.current.columnPinning.leftColumns).toContain('id')
  })
})

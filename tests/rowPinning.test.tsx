import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRowPinningState } from '../src/hooks/useRowPinningState'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'

describe('useRowPinningState', () => {
  it('starts with nothing pinned', () => {
    const { result } = renderHook(() => useRowPinningState())
    expect(result.current.state).toEqual({ top: [], bottom: [] })
    expect(result.current.topRows).toEqual([])
    expect(result.current.bottomRows).toEqual([])
  })

  it('pinTop adds a row to the top group', () => {
    const { result } = renderHook(() => useRowPinningState())
    act(() => result.current.pinTop('1'))
    expect(result.current.topRows).toEqual(['1'])
    expect(result.current.isPinned('1')).toBe('top')
  })

  it('pinBottom adds a row to the bottom group', () => {
    const { result } = renderHook(() => useRowPinningState())
    act(() => result.current.pinBottom('2'))
    expect(result.current.bottomRows).toEqual(['2'])
    expect(result.current.isPinned('2')).toBe('bottom')
  })

  it('pinning to the opposite edge moves the row rather than duplicating it', () => {
    const { result } = renderHook(() => useRowPinningState())
    act(() => result.current.pinTop('1'))
    act(() => result.current.pinBottom('1'))
    expect(result.current.topRows).toEqual([])
    expect(result.current.bottomRows).toEqual(['1'])
    expect(result.current.isPinned('1')).toBe('bottom')
  })

  it('pinning the same row twice does not duplicate it', () => {
    const { result } = renderHook(() => useRowPinningState())
    act(() => result.current.pinTop('1'))
    act(() => result.current.pinTop('1'))
    expect(result.current.topRows).toEqual(['1'])
  })

  it('unpin removes a row from either group', () => {
    const { result } = renderHook(() => useRowPinningState())
    act(() => result.current.pinTop('1'))
    act(() => result.current.pinBottom('2'))
    act(() => result.current.unpin('1'))
    act(() => result.current.unpin('2'))
    expect(result.current.state).toEqual({ top: [], bottom: [] })
  })

  it('isPinned returns false for an unpinned row', () => {
    const { result } = renderHook(() => useRowPinningState())
    expect(result.current.isPinned('9')).toBe(false)
  })

  it('clearPinning empties both groups', () => {
    const { result } = renderHook(() => useRowPinningState())
    act(() => result.current.pinTop('1'))
    act(() => result.current.pinBottom('2'))
    act(() => result.current.clearPinning())
    expect(result.current.state).toEqual({ top: [], bottom: [] })
  })

  it('accepts a default pinning state', () => {
    const { result } = renderHook(() =>
      useRowPinningState({ defaultPinning: { top: ['1'], bottom: ['2'] } })
    )
    expect(result.current.isPinned('1')).toBe('top')
    expect(result.current.isPinned('2')).toBe('bottom')
  })

  it('does not mutate the object passed as defaultPinning', () => {
    const defaultPinning = { top: ['1'], bottom: ['2'] }
    const { result } = renderHook(() => useRowPinningState({ defaultPinning }))
    act(() => result.current.pinTop('3'))
    act(() => result.current.unpin('2'))
    expect(defaultPinning).toEqual({ top: ['1'], bottom: ['2'] })
  })
})

type IntRow = { id: number; name: string }
const intColumns = createColumns<IntRow>([{ accessorKey: 'name', header: 'Name' }])
const intData: IntRow[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

describe('useTable — rowPinning', () => {
  it('pinTop moves the row into the top pinned rows', () => {
    const { result } = renderHook(() =>
      useTable({ data: intData, columns: intColumns, rowPinning: true })
    )
    act(() => result.current.rowPinning.pinTop('1'))

    expect(result.current.table.getTopRows().map(r => r.id)).toEqual(['1'])
  })

  it('leaves pinning empty when not enabled', () => {
    const { result } = renderHook(() =>
      useTable({ data: intData, columns: intColumns })
    )
    expect(result.current.rowPinning.topRows).toEqual([])
  })
})

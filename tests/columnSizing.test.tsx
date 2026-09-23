import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnSizingState } from '../src/hooks/useColumnSizingState'

describe('useColumnSizingState', () => {
  it('starts with no overrides', () => {
    const { result } = renderHook(() => useColumnSizingState())
    expect(result.current.state).toEqual({})
  })

  it('accepts default sizes', () => {
    const { result } = renderHook(() =>
      useColumnSizingState({ defaultSizing: { name: 200 } })
    )
    expect(result.current.getSize('name')).toBe(200)
  })

  it('setSize records a width', () => {
    const { result } = renderHook(() => useColumnSizingState())
    act(() => result.current.setSize('name', 250))
    expect(result.current.state).toEqual({ name: 250 })
    expect(result.current.getSize('name')).toBe(250)
  })

  it('setSize overwrites an existing width', () => {
    const { result } = renderHook(() =>
      useColumnSizingState({ defaultSizing: { name: 200 } })
    )
    act(() => result.current.setSize('name', 300))
    expect(result.current.getSize('name')).toBe(300)
  })

  it('getSize returns undefined for a column with no override', () => {
    const { result } = renderHook(() => useColumnSizingState())
    // undefined, not 0 — the column falls back to its columnDef size.
    expect(result.current.getSize('name')).toBeUndefined()
  })

  it('resetSize removes one column, leaving the others', () => {
    const { result } = renderHook(() =>
      useColumnSizingState({ defaultSizing: { name: 200, email: 300 } })
    )
    act(() => result.current.resetSize('name'))
    expect(result.current.state).toEqual({ email: 300 })
  })

  it('resetSize on an absent column is a no-op', () => {
    const { result } = renderHook(() =>
      useColumnSizingState({ defaultSizing: { name: 200 } })
    )
    act(() => result.current.resetSize('zzz'))
    expect(result.current.state).toEqual({ name: 200 })
  })

  it('resetAll clears every override', () => {
    const { result } = renderHook(() =>
      useColumnSizingState({ defaultSizing: { name: 200, email: 300 } })
    )
    act(() => result.current.resetAll())
    expect(result.current.state).toEqual({})
  })

  it('does not mutate the object passed as defaultSizing', () => {
    const defaultSizing = { name: 200 }
    const { result } = renderHook(() => useColumnSizingState({ defaultSizing }))
    act(() => result.current.setSize('name', 999))
    expect(defaultSizing).toEqual({ name: 200 })
  })
})

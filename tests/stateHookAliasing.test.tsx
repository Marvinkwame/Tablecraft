import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSortState } from '../src/hooks/useSortState'
import { useRowSelectionState } from '../src/hooks/useRowSelectionState'
import { useColumnVisibilityState } from '../src/hooks/useColumnVisibilityState'
import { useRowExpansionState } from '../src/hooks/useRowExpansionState'
import { useGroupingState } from '../src/hooks/useGroupingState'
import { useColumnFilterState } from '../src/hooks/useColumnFilterState'
import { usePaginationState } from '../src/hooks/usePaginationState'
import type { RowSelectionState } from '@tanstack/react-table'

/**
 * A granular state hook must seed its state from a COPY of the caller's
 * default, never from the caller's own object.
 *
 * Identity, not equality, is the assertion that catches this. Nothing mutates
 * these objects today — every setter builds a new value — so a "does not
 * mutate" test would pass against the aliasing code and prove nothing. What is
 * observable now is that `state === theCallerObject`, which means:
 *
 *   - two tables seeded from one module-scope constant share an initial
 *     reference, so `useEffect(..., [state])` comparisons behave differently
 *     before and after the first change;
 *   - any future setter written in `prev.push(...)` style corrupts the
 *     caller's object with nothing in the suite to catch it.
 *
 * useColumnPinningState had this and was fixed in 4.1.0; the three hooks added
 * in 4.1.0 were written to copy. These are the remainder.
 */

describe('granular state hooks — seed from a copy, not the caller object', () => {
  it('useSortState does not alias defaultSort', () => {
    const defaultSort = [{ id: 'name', desc: true }]
    const { result } = renderHook(() => useSortState({ defaultSort }))

    expect(result.current.state).toEqual(defaultSort)
    expect(result.current.state).not.toBe(defaultSort)
  })

  it('useRowSelectionState does not alias defaultSelection', () => {
    // RowSelectionState indexes to the literal `true`, not `boolean`.
    const defaultSelection: RowSelectionState = { '1': true }
    const { result } = renderHook(() => useRowSelectionState({ defaultSelection }))

    expect(result.current.state).toEqual(defaultSelection)
    expect(result.current.state).not.toBe(defaultSelection)
  })

  it('useColumnVisibilityState does not alias defaultVisibility', () => {
    const defaultVisibility = { email: false }
    const { result } = renderHook(() => useColumnVisibilityState({ defaultVisibility }))

    expect(result.current.state).toEqual(defaultVisibility)
    expect(result.current.state).not.toBe(defaultVisibility)
  })

  it('useRowExpansionState does not alias defaultExpanded', () => {
    const defaultExpanded = { '1': true }
    const { result } = renderHook(() => useRowExpansionState({ defaultExpanded }))

    expect(result.current.state).toEqual(defaultExpanded)
    expect(result.current.state).not.toBe(defaultExpanded)
  })

  it('useGroupingState does not alias defaultGrouping', () => {
    const defaultGrouping = ['department']
    const { result } = renderHook(() => useGroupingState({ defaultGrouping }))

    expect(result.current.state).toEqual(defaultGrouping)
    expect(result.current.state).not.toBe(defaultGrouping)
  })

  it('useColumnFilterState does not alias its default', () => {
    const defaultState = [{ id: 'status', value: 'Active' }]
    const { result } = renderHook(() => useColumnFilterState(defaultState))

    expect(result.current.state).toEqual(defaultState)
    expect(result.current.state).not.toBe(defaultState)
  })

  it('usePaginationState already builds a fresh object', () => {
    // The control: this one has always constructed its own state object, so it
    // proves the assertion above detects aliasing rather than always passing.
    const options = { pageIndex: 2, pageSize: 25 }
    const { result } = renderHook(() => usePaginationState(options))

    expect(result.current.state).toEqual(options)
    expect(result.current.state).not.toBe(options)
  })
})

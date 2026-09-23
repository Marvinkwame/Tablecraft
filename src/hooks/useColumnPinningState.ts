'use client'

import { useState, useCallback } from 'react'
import type { ColumnPinningState } from '@tanstack/react-table'
import type { ColumnPinningOptions } from '../types'

export type { ColumnPinningOptions as UseColumnPinningOptions } from '../types'

/**
 * Column pinning, using v9's logical start/end vocabulary rather than v8's
 * physical left/right. The rename is a correctness fix, not churn: "left" is
 * simply wrong in an RTL layout, which is why TanStack made the change.
 * Consumers get `inset-inline-start`-shaped semantics for free.
 */
export function useColumnPinningState(options: ColumnPinningOptions = {}) {
  const [state, setState] = useState<ColumnPinningState>(() =>
    // Copy, so a caller's object cannot be mutated through our setters.
    // Mirrors useRowPinningState's pattern.
    options.defaultPinning
      ? { start: [...(options.defaultPinning.start ?? [])], end: [...(options.defaultPinning.end ?? [])] }
      : { start: [], end: [] }
  )

  const pinStart = useCallback((id: string) =>
    setState(prev => ({
      start: [...(prev.start ?? []).filter(c => c !== id), id],
      end: (prev.end ?? []).filter(c => c !== id),
    })), [])

  const pinEnd = useCallback((id: string) =>
    setState(prev => ({
      start: (prev.start ?? []).filter(c => c !== id),
      end: [...(prev.end ?? []).filter(c => c !== id), id],
    })), [])

  const unpin = useCallback((id: string) =>
    setState(prev => ({
      start: (prev.start ?? []).filter(c => c !== id),
      end: (prev.end ?? []).filter(c => c !== id),
    })), [])

  const clearPinning = useCallback(() =>
    setState({ start: [], end: [] }), [])

  const isPinned = useCallback((id: string): 'start' | 'end' | false => {
    if ((state.start ?? []).includes(id)) return 'start'
    if ((state.end ?? []).includes(id)) return 'end'
    return false
  }, [state])

  return {
    state,
    setState,
    pinStart,
    pinEnd,
    unpin,
    clearPinning,
    isPinned,
    startColumns: state.start ?? [],
    endColumns: state.end ?? [],
  }
}

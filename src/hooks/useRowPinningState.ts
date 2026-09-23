'use client'

import { useState, useCallback } from 'react'
import type { RowPinningState } from '@tanstack/react-table'
import type { RowPinningOptions } from '../types'

export type { RowPinningOptions as UseRowPinningOptions } from '../types'

/**
 * Row pinning, using v9's top/bottom vocabulary. Note this is deliberately NOT
 * the start/end vocabulary used by column pinning: rows pin vertically, so
 * there is no RTL concern and `RowPinningPosition` is `false | 'top' |
 * 'bottom'`.
 */
export function useRowPinningState(options: RowPinningOptions = {}) {
  const [state, setState] = useState<RowPinningState>(() =>
    // Copy, so a caller's object cannot be mutated through our setters.
    // useColumnPinningState mirrors this pattern.
    options.defaultPinning
      ? { top: [...(options.defaultPinning.top ?? [])], bottom: [...(options.defaultPinning.bottom ?? [])] }
      : { top: [], bottom: [] }
  )

  const pinTop = useCallback((id: string) =>
    setState(prev => ({
      top: [...(prev.top ?? []).filter(r => r !== id), id],
      bottom: (prev.bottom ?? []).filter(r => r !== id),
    })), [])

  const pinBottom = useCallback((id: string) =>
    setState(prev => ({
      top: (prev.top ?? []).filter(r => r !== id),
      bottom: [...(prev.bottom ?? []).filter(r => r !== id), id],
    })), [])

  const unpin = useCallback((id: string) =>
    setState(prev => ({
      top: (prev.top ?? []).filter(r => r !== id),
      bottom: (prev.bottom ?? []).filter(r => r !== id),
    })), [])

  const clearPinning = useCallback(() =>
    setState({ top: [], bottom: [] }), [])

  const isPinned = useCallback((id: string): 'top' | 'bottom' | false => {
    if ((state.top ?? []).includes(id)) return 'top'
    if ((state.bottom ?? []).includes(id)) return 'bottom'
    return false
  }, [state])

  return {
    state,
    setState,
    pinTop,
    pinBottom,
    unpin,
    clearPinning,
    isPinned,
    topRows: state.top ?? [],
    bottomRows: state.bottom ?? [],
  }
}

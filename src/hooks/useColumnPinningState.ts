'use client'

import { useState, useCallback } from 'react'
import type { ColumnPinningState } from '@tanstack/react-table'
import type { ColumnPinningOptions } from '../types'

export type { ColumnPinningOptions as UseColumnPinningOptions } from '../types'

export function useColumnPinningState(options: ColumnPinningOptions = {}) {
  const [state, setState] = useState<ColumnPinningState>(
    options.defaultPinning ?? { left: [], right: [] }
  )

  const pinLeft = useCallback((id: string) =>
    setState(prev => ({
      left: [...(prev.left ?? []).filter(c => c !== id), id],
      right: (prev.right ?? []).filter(c => c !== id),
    })), [])

  const pinRight = useCallback((id: string) =>
    setState(prev => ({
      left: (prev.left ?? []).filter(c => c !== id),
      right: [...(prev.right ?? []).filter(c => c !== id), id],
    })), [])

  const unpin = useCallback((id: string) =>
    setState(prev => ({
      left: (prev.left ?? []).filter(c => c !== id),
      right: (prev.right ?? []).filter(c => c !== id),
    })), [])

  const clearPinning = useCallback(() =>
    setState({ left: [], right: [] }), [])

  const isPinned = useCallback((id: string): 'left' | 'right' | false => {
    if ((state.left ?? []).includes(id)) return 'left'
    if ((state.right ?? []).includes(id)) return 'right'
    return false
  }, [state])

  return {
    state,
    setState,
    pinLeft,
    pinRight,
    unpin,
    clearPinning,
    isPinned,
    leftColumns: state.left ?? [],
    rightColumns: state.right ?? [],
  }
}

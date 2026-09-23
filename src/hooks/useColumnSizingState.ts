'use client'

import { useState, useCallback } from 'react'
import type { ColumnSizingState } from '@tanstack/react-table'
import type { ColumnSizingOptions } from '../types'

export type { ColumnSizingOptions as UseColumnSizingOptions } from '../types'

/**
 * Committed column widths, keyed by leaf column id. This is the state half of
 * resizing: `useColumnResizing`'s drag handles write their result here.
 *
 * Not to be confused with v9's `columnResizing` slice, which holds transient
 * drag info (deltaOffset, isResizingColumn) and is never surfaced by
 * tablecraft.
 *
 * A column with no entry falls back to its columnDef `size`, which is why
 * `getSize` returns undefined rather than 0 for an unset column.
 */
export function useColumnSizingState(options: ColumnSizingOptions = {}) {
  const [state, setState] = useState<ColumnSizingState>(
    // Copy, so a caller's object cannot be mutated through our setters.
    options.defaultSizing ? { ...options.defaultSizing } : {}
  )

  const setSize = useCallback((columnId: string, px: number) =>
    setState(prev => ({ ...prev, [columnId]: px })), [])

  const resetSize = useCallback((columnId: string) =>
    setState(prev => {
      if (!(columnId in prev)) return prev
      const next = { ...prev }
      delete next[columnId]
      return next
    }), [])

  const resetAll = useCallback(() => setState({}), [])

  const getSize = useCallback(
    (columnId: string): number | undefined => state[columnId],
    [state]
  )

  return { state, setState, setSize, resetSize, resetAll, getSize }
}

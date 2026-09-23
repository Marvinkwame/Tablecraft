'use client'

import { useState, useCallback } from 'react'
import type { ColumnOrderState } from '@tanstack/react-table'
import type { ColumnOrderOptions } from '../types'

export type { ColumnOrderOptions as UseColumnOrderOptions } from '../types'

/**
 * Column order. An empty array is TanStack's "natural order" sentinel, so
 * `moveColumn` is a no-op until the order is seeded — see `defaultOrder`.
 *
 * This hook supplies state and a move helper only. The drag interaction is
 * deliberately not provided: dnd-kit does it better and would mean a heavy new
 * peer dependency.
 */
export function useColumnOrderState(options: ColumnOrderOptions = {}) {
  const [state, setState] = useState<ColumnOrderState>(
    // Copy, so a caller's array cannot be mutated through our setters.
    options.defaultOrder ? [...options.defaultOrder] : []
  )

  const setOrder = useCallback((columnIds: string[]) => setState([...columnIds]), [])

  const moveColumn = useCallback((columnId: string, toIndex: number) =>
    setState(prev => {
      const from = prev.indexOf(columnId)
      if (from === -1) return prev
      const next = [...prev]
      next.splice(from, 1)
      // Clamp rather than drop: splice past the end would silently append,
      // which is the same result, but a negative index would insert from the
      // right and surprise the caller.
      const target = Math.max(0, Math.min(toIndex, next.length))
      next.splice(target, 0, columnId)
      return next
    }), [])

  const resetOrder = useCallback(() => setState([]), [])

  return {
    state,
    setState,
    setOrder,
    moveColumn,
    resetOrder,
    order: state,
  }
}

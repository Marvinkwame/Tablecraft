'use client'

import { useState, useCallback, useMemo } from 'react'
import type { ExpandedState, OnChangeFn } from '@tanstack/react-table'

export interface UseRowExpansionOptions {
  defaultExpanded?: ExpandedState
  /** When false, expanding a new row collapses all others. Default: true */
  allowMultiple?: boolean
}

export function useRowExpansionState(options: UseRowExpansionOptions = {}) {
  const { defaultExpanded = {}, allowMultiple = true } = options

  const [expanded, setExpanded] = useState<ExpandedState>(defaultExpanded)

  const toggleRow = useCallback((rowId: string) => {
    setExpanded((prev) => {
      if (prev === true) return allowMultiple ? prev : {}
      const isOn = !!(prev as Record<string, boolean>)[rowId]
      if (allowMultiple) {
        const next = { ...(prev as Record<string, boolean>) }
        if (isOn) delete next[rowId]
        else next[rowId] = true
        return next
      }
      return isOn ? {} : { [rowId]: true }
    })
  }, [allowMultiple])

  const expandRow = useCallback((rowId: string) => {
    setExpanded((prev) => {
      if (prev === true) return true
      if (allowMultiple) return { ...(prev as Record<string, boolean>), [rowId]: true }
      return { [rowId]: true }
    })
  }, [allowMultiple])

  const collapseRow = useCallback((rowId: string) => {
    setExpanded((prev) => {
      if (prev === true) return prev // can't partially collapse the "all" sentinel
      const next = { ...(prev as Record<string, boolean>) }
      delete next[rowId]
      return next
    })
  }, [])

  const clearExpansion = useCallback(() => setExpanded({}), [])

  // When state is the `true` sentinel (expand-all), individual IDs are not tracked.
  // Consumers should call table.getIsAllRowsExpanded() in that case.
  const expandedRowIds = useMemo(() => {
    if (expanded === true) return []
    return Object.keys(expanded as Record<string, boolean>).filter(
      (id) => (expanded as Record<string, boolean>)[id]
    )
  }, [expanded])

  const isExpanded = useCallback((rowId: string) => {
    if (expanded === true) return true
    return !!(expanded as Record<string, boolean>)[rowId]
  }, [expanded])

  return {
    state: expanded,
    onExpandedChange: setExpanded as OnChangeFn<ExpandedState>,
    toggleRow,
    expandRow,
    collapseRow,
    clearExpansion,
    expandedRowIds,
    isExpanded,
  }
}

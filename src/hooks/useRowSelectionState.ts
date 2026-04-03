'use client'

import { useState, useCallback, useMemo } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'

export interface UseRowSelectionOptions {
  defaultSelection?: RowSelectionState
  enableMultiRowSelection?: boolean
}

export function useRowSelectionState(options: UseRowSelectionOptions = {}) {
  const { defaultSelection = {}, enableMultiRowSelection = true } = options

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(defaultSelection)

  const toggleRow = useCallback(
    (rowId: string) => {
      setRowSelection((prev) => {
        if (enableMultiRowSelection) {
          const next = { ...prev }
          if (next[rowId]) {
            delete next[rowId]
          } else {
            next[rowId] = true
          }
          return next
        }
        // Single selection: clear others
        return prev[rowId] ? {} : { [rowId]: true }
      })
    },
    [enableMultiRowSelection]
  )

  const toggleAll = useCallback(
    (rowIds: string[]) => {
      setRowSelection((prev) => {
        const allSelected = rowIds.every((id) => prev[id])
        if (allSelected) return {}
        const next: RowSelectionState = {}
        for (const id of rowIds) {
          next[id] = true
        }
        return next
      })
    },
    []
  )

  const clearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  const selectedRowIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection]
  )

  const selectedCount = selectedRowIds.length

  const isSelected = useCallback(
    (rowId: string) => !!rowSelection[rowId],
    [rowSelection]
  )

  return {
    state: rowSelection,
    onRowSelectionChange: setRowSelection,
    toggleRow,
    toggleAll,
    clearSelection,
    selectedRowIds,
    selectedCount,
    isSelected,
    enableMultiRowSelection,
  }
}

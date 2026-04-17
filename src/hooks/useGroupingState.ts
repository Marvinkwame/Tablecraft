'use client'

import { useState, useCallback, useMemo } from 'react'
import type { GroupingState, OnChangeFn } from '@tanstack/react-table'

export interface UseGroupingOptions {
  defaultGrouping?: GroupingState
  manualGrouping?: boolean
  groupedColumnMode?: false | 'reorder' | 'remove'
}

export function useGroupingState(options: UseGroupingOptions = {}) {
  const { defaultGrouping = [] } = options

  const [grouping, setGrouping] = useState<GroupingState>(defaultGrouping)

  const toggleGrouping = useCallback((columnId: string) => {
    setGrouping((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    )
  }, [])

  const setGroupingState = useCallback((cols: GroupingState) => {
    setGrouping(cols)
  }, [])

  const clearGrouping = useCallback(() => {
    setGrouping([])
  }, [])

  const isGrouped = useCallback(
    (columnId: string) => grouping.includes(columnId),
    [grouping]
  )

  const groupedColumns = useMemo(() => grouping, [grouping])

  return {
    state: grouping,
    onGroupingChange: setGrouping as OnChangeFn<GroupingState>,
    toggleGrouping,
    setGrouping: setGroupingState,
    clearGrouping,
    isGrouped,
    groupedColumns,
  }
}

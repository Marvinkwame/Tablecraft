'use client'

import { useState, useCallback, useMemo } from 'react'
import type { VisibilityState } from '@tanstack/react-table'

export interface UseColumnVisibilityOptions {
  defaultVisibility?: VisibilityState
}

export function useColumnVisibilityState(options: UseColumnVisibilityOptions = {}) {
  const { defaultVisibility = {} } = options

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultVisibility)

  const toggleColumn = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: prev[columnId] === false ? true : false,
    }))
  }, [])

  const showColumn = useCallback((columnId: string) => {
    setColumnVisibility((prev) => {
      const next = { ...prev }
      delete next[columnId]
      return next
    })
  }, [])

  const hideColumn = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: false,
    }))
  }, [])

  const showAll = useCallback(() => {
    setColumnVisibility({})
  }, [])

  const hiddenColumns = useMemo(
    () => Object.keys(columnVisibility).filter((id) => columnVisibility[id] === false),
    [columnVisibility]
  )

  return {
    state: columnVisibility,
    onColumnVisibilityChange: setColumnVisibility,
    toggleColumn,
    showColumn,
    hideColumn,
    showAll,
    hiddenColumns,
  }
}

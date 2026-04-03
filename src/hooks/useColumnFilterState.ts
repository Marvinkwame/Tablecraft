'use client'

import { useState, useCallback } from 'react'
import type { ColumnFiltersState } from '@tanstack/react-table'

export function useColumnFilterState(defaultState: ColumnFiltersState = []) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(defaultState)

  const setFilter = useCallback((columnId: string, value: unknown) => {
    setColumnFilters((prev) => {
      const existing = prev.filter((f) => f.id !== columnId)
      return [...existing, { id: columnId, value }]
    })
  }, [])

  const clearFilter = useCallback((columnId: string) => {
    setColumnFilters((prev) => prev.filter((f) => f.id !== columnId))
  }, [])

  const clearAll = useCallback(() => {
    setColumnFilters([])
  }, [])

  return {
    state: columnFilters,
    onColumnFiltersChange: setColumnFilters,
    setFilter,
    clearFilter,
    clearAll,
  }
}

'use client'

import { useState, useCallback } from 'react'
import type { SortingState } from '@tanstack/react-table'
import type { SortingOptions } from '../types'

export function useSortState(options: SortingOptions = {}) {
  const { defaultSort = [] } = options

  // Seed from a copy: state must never be the caller's own object.
  const [sorting, setSorting] = useState<SortingState>(() => [...defaultSort])

  const clearSorting = useCallback(() => {
    setSorting([])
  }, [])

  return {
    state: sorting,
    onSortingChange: setSorting,
    clearSorting,
  }
}

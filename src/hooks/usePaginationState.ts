'use client'

import { useState, useCallback } from 'react'
import type { PaginationState } from '@tanstack/react-table'
import type { PaginationOptions } from '../types'

export function usePaginationState(options: PaginationOptions = {}) {
  const { pageSize = 10, pageIndex = 0 } = options

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex,
    pageSize,
  })

  const setPageIndex = useCallback((index: number) => {
    setPagination((prev) => ({ ...prev, pageIndex: index }))
  }, [])

  const setPageSize = useCallback((size: number) => {
    setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))
  }, [])

  const nextPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))
  }, [])

  const previousPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(0, prev.pageIndex - 1),
    }))
  }, [])

  return {
    state: pagination,
    onPaginationChange: setPagination,
    setPageIndex,
    setPageSize,
    nextPage,
    previousPage,
  }
}

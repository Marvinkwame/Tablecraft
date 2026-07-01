'use client'

import { useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { RowData, Table } from '@tanstack/react-table'
import type { VirtualRowsOptions, VirtualRowsReturn } from '../types'

export function useVirtualRows<TData extends RowData>(
  table: Table<TData>,
  options: VirtualRowsOptions
): VirtualRowsReturn<TData> {
  const { rowHeight, overscan = 5 } = options
  const containerRef = useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  const virtualRows = virtualizer.getVirtualItems().map((item) => ({
    row: rows[item.index],
    index: item.index,
    start: item.start,
    size: item.size,
  }))

  const scrollToIndex = useCallback(
    (index: number) => virtualizer.scrollToIndex(index),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [virtualizer]
  )

  return {
    virtualRows,
    totalHeight: virtualizer.getTotalSize(),
    containerRef,
    scrollToIndex,
  }
}

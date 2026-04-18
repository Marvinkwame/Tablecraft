'use client'

import { useState, useCallback } from 'react'
import type { RowData, Table } from '@tanstack/react-table'
import type { TableA11yReturn } from '../types'
import {
  getAriaSortValue,
  getAriaRowCount,
  getAriaColCount,
  getAriaRowIndex,
} from '../a11y/ariaAttributes'

export interface UseTableA11yOptions {
  /** Set to true when row selection is enabled on the table. Adds aria-selected to row props. */
  selectionEnabled?: boolean
}

export function useTableA11y<TData extends RowData>(
  table: Table<TData>,
  options: UseTableA11yOptions = {}
): TableA11yReturn {
  const { selectionEnabled = false } = options
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)

  // ─── getTableProps ────────────────────────────────────────
  const getTableProps = useCallback(() => ({
    role: 'grid' as const,
    'aria-rowcount': getAriaRowCount(table),
    'aria-colcount': getAriaColCount(table),
  }), [table])

  // ─── getHeaderProps ───────────────────────────────────────
  const getHeaderProps = useCallback((headerId: string) => ({
    role: 'columnheader' as const,
    'aria-sort': getAriaSortValue(headerId, table.getState().sorting),
  }), [table])

  // ─── getRowProps ──────────────────────────────────────────
  const getRowProps = useCallback((rowId: string) => {
    const rows = table.getRowModel().rows
    const row = rows.find((r) => r.id === rowId)
    const rowIndex = getAriaRowIndex(rowId, rows)
    const positionIndex = rowIndex - 1 // 0-based for tabIndex logic

    // Determine tabIndex: focused row gets 0, first row gets 0 when nothing focused
    const effectiveFocused = focusedRowIndex ?? 0
    const tabIndex: 0 | -1 = positionIndex === effectiveFocused ? 0 : -1

    // aria-selected: only when selection is explicitly enabled
    const ariaSelected = selectionEnabled && row
      ? { 'aria-selected': row.getIsSelected() }
      : {}

    // aria-expanded: only when the row is expandable
    const ariaExpanded = row?.getCanExpand()
      ? { 'aria-expanded': row.getIsExpanded() }
      : {}

    // Keyboard handler — row-level navigation
    const onKeyDown = (e: React.KeyboardEvent) => {
      const totalRows = table.getRowModel().rows.length
      const current = focusedRowIndex ?? 0

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedRowIndex(Math.min(current + 1, totalRows - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedRowIndex(Math.max(current - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          setFocusedRowIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusedRowIndex(totalRows - 1)
          break
        case 'Enter':
        case ' ':
          if (row && selectionEnabled) {
            e.preventDefault()
            row.toggleSelected()
          }
          break
        default:
          break
      }
    }

    return {
      role: 'row' as const,
      'aria-rowindex': rowIndex,
      ...ariaSelected,
      ...ariaExpanded,
      tabIndex,
      onKeyDown,
    }
  }, [table, focusedRowIndex, selectionEnabled])

  // ─── getCellProps ─────────────────────────────────────────
  const getCellProps = useCallback((columnIndex: number) => ({
    role: 'gridcell' as const,
    'aria-colindex': columnIndex + 1, // 1-based
  }), [])

  return {
    getTableProps,
    getHeaderProps,
    getRowProps,
    getCellProps,
    focusedRowIndex,
  }
}

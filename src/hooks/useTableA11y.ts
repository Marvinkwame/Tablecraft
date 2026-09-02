'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { RowData, Table } from '@tanstack/react-table'
import type { TableA11yReturn } from '../types'
import {
  getAriaSortValue,
  getAriaRowCount,
  getAriaColCount,
  getAriaRowIndex,
} from '../a11y/ariaAttributes'

/** Rows moved per PageUp/PageDown, per the ARIA grid pattern's "author-defined number". */
const PAGE_KEY_ROWS = 10

export interface UseTableA11yOptions {
  /** Set to true when row selection is enabled on the table. Adds aria-selected to row props. */
  selectionEnabled?: boolean
  /**
   * Opt in to cell-level (2D) keyboard navigation.
   *
   * Off by default, which keeps the row-level roving tabindex and the
   * row-scoped Home/End behaviour of earlier versions. When on, pass the row id
   * as the second argument to `getCellProps` and spread the result onto each
   * cell — the roving tabindex moves to the cell, and ArrowLeft/ArrowRight,
   * Home/End, Ctrl+Home/Ctrl+End and PageUp/PageDown become available.
   */
  cellNavigation?: boolean
}

export function useTableA11y<TData extends RowData>(
  table: Table<TData>,
  options: UseTableA11yOptions = {}
): TableA11yReturn {
  const { selectionEnabled = false, cellNavigation = false } = options
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null)
  const [focusedColumnIndex, setFocusedColumnIndex] = useState<number | null>(null)

  const effectiveRow = focusedRowIndex ?? 0
  const effectiveColumn = focusedColumnIndex ?? 0

  // ─── Focus management ─────────────────────────────────────
  // A roving tabindex only works if focus actually roves. Elements register
  // themselves through the `ref` returned by getRowProps/getCellProps, and a
  // keyboard move focuses the newly-current one.
  const rowElements = useRef(new Map<number, HTMLElement>())
  const cellElements = useRef(new Map<string, HTMLElement>())
  // Gates focus to keyboard interaction, so mounting a grid never steals focus
  // from elsewhere on the page.
  const pendingFocus = useRef(false)

  const registerElement = <K,>(map: Map<K, HTMLElement>, key: K) =>
    (el: HTMLElement | null) => {
      if (el) map.set(key, el)
      else map.delete(key)
    }

  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    const target = cellNavigation
      ? cellElements.current.get(`${effectiveRow}:${effectiveColumn}`)
      : rowElements.current.get(effectiveRow)
    target?.focus()
  })

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

  // ─── Shared movement ──────────────────────────────────────
  // Clamps to the rendered grid: rows are page-relative because you can only
  // focus what is actually in the DOM.
  const moveTo = useCallback((rowIndex: number, columnIndex: number) => {
    pendingFocus.current = true
    const lastRow = Math.max(table.getRowModel().rows.length - 1, 0)
    const lastColumn = Math.max(getAriaColCount(table) - 1, 0)
    setFocusedRowIndex(Math.min(Math.max(rowIndex, 0), lastRow))
    setFocusedColumnIndex(Math.min(Math.max(columnIndex, 0), lastColumn))
  }, [table])

  // ─── getRowProps ──────────────────────────────────────────
  const getRowProps = useCallback((rowId: string) => {
    const rows = table.getRowModel().rows
    // aria-rowindex is the position within the FULL row set, not the current
    // page — that is the whole reason it exists alongside aria-rowcount. Use
    // the pre-pagination model so the index survives pagination and, unlike
    // getFilteredRowModel(), reflects the user's sort rather than data order.
    const indexRows = table.getPrePaginationRowModel().rows
    const row = rows.find((r) => r.id === rowId) ?? indexRows.find((r) => r.id === rowId)
    const rowIndex = getAriaRowIndex(rowId, indexRows)

    // The roving tabindex is page-relative: you can only focus a row that is
    // actually rendered, so this must NOT reuse the global aria-rowindex.
    const positionIndex = rows.findIndex((r) => r.id === rowId)

    // In cell mode the tabindex lives on the cell, so no row is tabbable.
    const tabIndex: 0 | -1 = cellNavigation
      ? -1
      : positionIndex === effectiveRow ? 0 : -1

    // aria-selected: only when selection is explicitly enabled
    const ariaSelected = selectionEnabled && row
      ? { 'aria-selected': row.getIsSelected() }
      : {}

    // aria-expanded: only when the row is expandable
    const ariaExpanded = row?.getCanExpand()
      ? { 'aria-expanded': row.getIsExpanded() }
      : {}

    // Keyboard handler — row-level navigation.
    // In cell mode this is deliberately inert: the cell handler already ran and
    // the event bubbles up to the row, so acting here would move twice.
    const onKeyDown = (e: React.KeyboardEvent) => {
      if (cellNavigation) return

      const totalRows = table.getRowModel().rows.length
      const current = focusedRowIndex ?? 0

      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        pendingFocus.current = true
      }

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
      ref: registerElement(rowElements.current, positionIndex),
      'aria-rowindex': rowIndex,
      ...ariaSelected,
      ...ariaExpanded,
      tabIndex,
      onKeyDown,
    }
  }, [table, focusedRowIndex, effectiveRow, selectionEnabled, cellNavigation])

  // ─── getCellProps ─────────────────────────────────────────
  const getCellProps = useCallback((columnIndex: number, rowId?: string) => {
    const base = {
      role: 'gridcell' as const,
      'aria-colindex': columnIndex + 1, // 1-based
    }

    // Without cellNavigation — or without a row id to anchor the cell — the
    // props stay exactly as they were before cell navigation existed.
    if (!cellNavigation || rowId === undefined) return base

    const rows = table.getRowModel().rows
    const positionIndex = rows.findIndex((r) => r.id === rowId)
    const tabIndex: 0 | -1 =
      positionIndex === effectiveRow && columnIndex === effectiveColumn ? 0 : -1

    const onKeyDown = (e: React.KeyboardEvent) => {
      const lastRow = Math.max(rows.length - 1, 0)
      const lastColumn = Math.max(getAriaColCount(table) - 1, 0)

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          moveTo(effectiveRow, effectiveColumn + 1)
          break
        case 'ArrowLeft':
          e.preventDefault()
          moveTo(effectiveRow, effectiveColumn - 1)
          break
        case 'ArrowDown':
          e.preventDefault()
          moveTo(effectiveRow + 1, effectiveColumn)
          break
        case 'ArrowUp':
          e.preventDefault()
          moveTo(effectiveRow - 1, effectiveColumn)
          break
        case 'Home':
          e.preventDefault()
          // Ctrl+Home is the whole grid; plain Home is this row only.
          moveTo(e.ctrlKey ? 0 : effectiveRow, 0)
          break
        case 'End':
          e.preventDefault()
          moveTo(e.ctrlKey ? lastRow : effectiveRow, lastColumn)
          break
        case 'PageDown':
          e.preventDefault()
          moveTo(effectiveRow + PAGE_KEY_ROWS, effectiveColumn)
          break
        case 'PageUp':
          e.preventDefault()
          moveTo(effectiveRow - PAGE_KEY_ROWS, effectiveColumn)
          break
        case 'Enter':
        case ' ': {
          // Selection follows the focused cell's row, which is not necessarily
          // the row this handler was attached to.
          const focusedRow = rows[effectiveRow]
          if (focusedRow && selectionEnabled) {
            e.preventDefault()
            focusedRow.toggleSelected()
          }
          break
        }
        default:
          break
      }
    }

    return {
      ...base,
      ref: registerElement(cellElements.current, `${positionIndex}:${columnIndex}`),
      tabIndex,
      onKeyDown,
    }
  }, [table, cellNavigation, effectiveRow, effectiveColumn, moveTo, selectionEnabled])

  return {
    getTableProps,
    getHeaderProps,
    getRowProps,
    getCellProps,
    focusedRowIndex,
    focusedCell: cellNavigation
      ? { rowIndex: effectiveRow, columnIndex: effectiveColumn }
      : null,
  }
}

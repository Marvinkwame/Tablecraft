'use client'

import { useCallback } from 'react'
import type { RowData } from '@tanstack/react-table'
import type { TablecraftTable } from '../features'
import type { ColumnResizingReturn, ResizeHandleProps } from '../types'

/**
 * Drag-to-resize handle props.
 *
 * Split from `useTable` on purpose: the committed widths are table state and
 * belong in `useTable`, but `header.getResizeHandler()` needs the table
 * instance. That is the same seam `useTableA11y` and `useVirtualRows` sit on.
 *
 * Pair with `useTable({ columnResizing: true })` — without that the table has
 * no resize mode wired and the handles have nowhere to write.
 */
export function useColumnResizing<TData extends RowData>(
  table: TablecraftTable<TData>
): ColumnResizingReturn {
  const resizingColumnId = table.store.state.columnResizing.isResizingColumn || null

  const isResizing = useCallback(
    (columnId: string) => table.store.state.columnResizing.isResizingColumn === columnId,
    [table]
  )

  // A plain function, not useCallback: every value is read from the table at
  // call time, so there is nothing stale to memoise away.
  const getResizeHandleProps = (headerId: string): ResizeHandleProps => {
    const header = table.getFlatHeaders().find(h => h.id === headerId)

    // Inert props for an unknown header or a column that opted out. Returning
    // a valid object rather than throwing means a stale header id in a
    // consumer's render does not crash the table.
    if (!header || !header.column.getCanResize()) {
      return {
        style: { cursor: 'default', touchAction: 'none', userSelect: 'none' },
        'data-can-resize': false,
        'data-resizing': false,
      }
    }

    const handler = header.getResizeHandler()

    return {
      onMouseDown: handler,
      onTouchStart: handler,
      style: { cursor: 'col-resize', touchAction: 'none', userSelect: 'none' },
      'data-can-resize': true,
      'data-resizing': header.column.getIsResizing(),
    }
  }

  return { getResizeHandleProps, isResizing, resizingColumnId }
}

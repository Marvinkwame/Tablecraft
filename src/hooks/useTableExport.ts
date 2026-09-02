'use client'

import { useCallback, useMemo } from 'react'
import type { RowData, Table } from '@tanstack/react-table'

import type { UseTableExportOptions, DownloadOptions, TableExportReturn } from '../types'
import { extractRows, toCSVString } from '../utils/exportRows'

/** UTF-8 byte order mark. Written as an escape so it survives copy/paste and re-encoding. */
const BOM = '\uFEFF'

/**
 * Export a table to CSV or JSON.
 *
 * Returns functions rather than values, so nothing is computed until the
 * consumer asks — a table whose export button is never clicked pays nothing.
 */
export function useTableExport<TData extends RowData>(
  table: Table<TData>,
  options: UseTableExportOptions = {}
): TableExportReturn {
  const base = useMemo(
    () => options,
    // Arrays are compared by content so a fresh literal each render is not a change.
    [
      options.rows,
      options.columns,
      options.delimiter,
      options.header,
      options.include?.join(' '),
      options.exclude?.join(' '),
    ]
  )

  const resolve = useCallback(
    (overrides?: UseTableExportOptions): UseTableExportOptions => ({ ...base, ...overrides }),
    [base]
  )

  const toRows = useCallback(
    (overrides?: UseTableExportOptions) => extractRows(table, resolve(overrides)).rows,
    [table, resolve]
  )

  const toCSV = useCallback(
    (overrides?: UseTableExportOptions) => {
      const merged = resolve(overrides)
      const { labels, rows } = extractRows(table, merged)
      return toCSVString(rows, labels, { delimiter: merged.delimiter, header: merged.header })
    },
    [table, resolve]
  )

  const toJSON = useCallback(
    (overrides?: UseTableExportOptions) => JSON.stringify(toRows(overrides), null, 2),
    [toRows]
  )

  const download = useCallback(
    (format: 'csv' | 'json', filename?: string, overrides?: DownloadOptions) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error(
          '[tablecraft] download() requires a browser environment. It was called during ' +
          'server-side rendering — move the call into an event handler or effect.'
        )
      }

      const { bom = true, ...exportOverrides } = overrides ?? {}
      const isCSV = format === 'csv'
      const body = isCSV ? toCSV(exportOverrides) : toJSON(exportOverrides)
      const contents = isCSV && bom ? `${BOM}${body}` : body

      const blob = new Blob([contents], {
        type: isCSV ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename ?? `export.${format}`
      anchor.click()
      URL.revokeObjectURL(url)
    },
    [toCSV, toJSON]
  )

  return { toRows, toCSV, toJSON, download }
}

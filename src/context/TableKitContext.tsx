'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { TableKitDefaults } from '../types'

const TableKitContext = createContext<TableKitDefaults | null>(null)

export interface TableKitProviderProps {
  /** Default options applied to all useTable / useQueryTable calls within this provider */
  defaults: TableKitDefaults
  children: ReactNode
}

/**
 * Set app-level defaults for all tablecraft hooks.
 * Per-call options always override provider defaults.
 *
 * ```tsx
 * <TableKitProvider defaults={{ pageSize: 20, fuzzy: true }}>
 *   <App />
 * </TableKitProvider>
 * ```
 */
export function TableKitProvider({ defaults, children }: TableKitProviderProps) {
  return (
    <TableKitContext.Provider value={defaults}>
      {children}
    </TableKitContext.Provider>
  )
}

/**
 * Read the current TableKitProvider defaults.
 * Returns an empty object if no provider is present (safe to use without provider).
 */
export function useTableKitDefaults(): TableKitDefaults {
  return useContext(TableKitContext) ?? {}
}

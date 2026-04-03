import type { FilterFn } from '@tanstack/react-table'

/**
 * Creates a fuzzy filter function using match-sorter.
 * match-sorter is an optional peer dependency — this will throw a helpful
 * error if it's not installed.
 */
export function createFuzzyFilter<TData>(): FilterFn<TData> {
  let matchSorterModule: typeof import('match-sorter') | null = null

  // Attempt to load match-sorter lazily
  try {
    matchSorterModule = require('match-sorter')
  } catch {
    // Will be caught when the filter is first called
  }

  const fuzzyFilter: FilterFn<TData> = (row, columnId, filterValue, addMeta) => {
    if (!matchSorterModule) {
      throw new Error(
        '[tablecraft] fuzzy search requires "match-sorter" as a peer dependency. ' +
        'Install it with: npm install match-sorter'
      )
    }

    const { rankItem } = matchSorterModule

    const itemRank = rankItem(row.getValue(columnId), filterValue as string)
    addMeta({ itemRank })

    return itemRank.passed
  }

  // Allow TanStack Table to re-filter and re-sort after each filter change
  fuzzyFilter.autoRemove = (val: unknown) => !val

  return fuzzyFilter
}

/**
 * Fuzzy sort function for use with TanStack Table's sorting.
 * Sorts rows by their fuzzy match rank (best matches first).
 */
export function fuzzySort<TData>(rowA: any, rowB: any, columnId: string): number {
  let dir = 0

  // Only sort by rank if the column has ranking info
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank,
      rowB.columnFiltersMeta[columnId]?.itemRank
    )
  }

  // Provide a fallback for when items have equal rank
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

function compareItems(a: any, b: any): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0
}

// Inline minimal alphanumeric sort to avoid extra import
const sortingFns = {
  alphanumeric: (rowA: any, rowB: any, columnId: string): number => {
    const a = String(rowA.getValue(columnId)).toLowerCase()
    const b = String(rowB.getValue(columnId)).toLowerCase()
    return a < b ? -1 : a > b ? 1 : 0
  },
}

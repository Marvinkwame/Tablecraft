import type { RowData } from '@tanstack/react-table'
import type { TablecraftTable } from '../features'

/**
 * Tracks which tables are genuinely server-backed (remote pagination), as
 * distinct from tables that merely have `manualPagination` forced on to
 * short-circuit v9's always-registered `paginatedRowModel` factory.
 *
 * v9 gives every table the full feature set (see `tablecraftFeatures`), so
 * `getRowModel()` cannot be told "there is no pagination row model" the way
 * v8 could by simply not passing `getPaginationRowModel`. The only lever v9
 * exposes is `table.options.manualPagination` (see
 * `coreRowModelsFeature.utils.js`: `manualPagination || !factory` falls back
 * to the pre-pagination row model). `useTable` therefore sets
 * `manualPagination: manualPagination || !paginationEnabled`, which means
 * `table.options.manualPagination` no longer reliably signals "this table's
 * data lives on a server" — it is equally true for a purely client-side
 * table that just asked for `pagination: false`.
 *
 * Consumers that need the original, narrower signal (e.g. `useFacetedFilters`
 * deciding whether the full dataset is even available to facet) read it from
 * here instead of from `table.options.manualPagination`.
 *
 * Keyed by table identity via a WeakMap: v9's `useTable` wrapper returns a new
 * object every render whose options changed (see
 * `@tanstack/react-table`'s `useTable.js`), so `useTable` re-registers the
 * flag on every render rather than once.
 */
const serverTableFlags = new WeakMap<object, boolean>()

/** Called by `useTable` to record the caller's actual manualPagination intent. */
export function setServerTableFlag(table: object, isServer: boolean): void {
  serverTableFlags.set(table, isServer)
}

/** Called by consumers that need to know whether a table's data is remote. */
export function isServerBackedTable<TData extends RowData>(
  table: TablecraftTable<TData>
): boolean {
  return serverTableFlags.get(table) === true
}

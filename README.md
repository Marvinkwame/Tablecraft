# tablecraft

> Batteries-included [TanStack Table](https://tanstack.com/table) wrapper for React. TypeScript-first, headless, zero UI lock-in.

**Go from ~100 lines of TanStack Table boilerplate to ~10 lines.** No CSS. No component library. Full escape hatch to the raw table instance.

```
npm i @marvinackerman/tablecraft @tanstack/react-table
```

## Quick Start

```tsx
import { useTable, createColumns } from '@marvinackerman/tablecraft'
import { flexRender } from '@tanstack/react-table'

type User = { id: number; name: string; email: string; role: string }

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
])

function UsersTable({ users }: { users: User[] }) {
  const { table, pagination, sorting, globalFilter } = useTable({
    data: users,
    columns,
    pagination: { pageSize: 20 },
    sorting: true,
    globalFilter: true,
  })

  return (
    <div>
      <input
        placeholder="Search..."
        value={globalFilter.value}
        onChange={(e) => globalFilter.setValue(e.target.value)}
      />
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={pagination.previousPage} disabled={!pagination.canPreviousPage}>Previous</button>
        <span>Page {pagination.pageIndex + 1} of {pagination.pageCount}</span>
        <button onClick={pagination.nextPage} disabled={!pagination.canNextPage}>Next</button>
      </div>
    </div>
  )
}
```

Sorting, pagination, global search, full TypeScript generics — wired up in one call.

---

## Why tablecraft?

`@tanstack/react-table` is intentionally 100% headless. That's its strength, but every project starts with 80–150 lines of identical boilerplate: `useState` for sorting, `useState` for pagination, `useState` for filters, `useMemo` for columns, manual row model wiring…

**tablecraft eliminates the boilerplate without taking away control.** You get sensible defaults, and the full TanStack Table instance is always available as an escape hatch.

| Feature | TanStack Table | AG Grid | Material React Table | **tablecraft** |
|---|---|---|---|---|
| Headless (no CSS) | Yes | No | No | **Yes** |
| Zero boilerplate | No | Yes | Yes | **Yes** |
| TypeScript-first | Yes | Yes | Yes | **Yes** |
| State persistence | No | Enterprise $$ | No | **Free** |
| Inline editing | No | Enterprise $$ | No | **Free** |
| Bundle size | ~15 KB | ~300 KB | ~50 KB | **~21 KB** (tablecraft + TanStack) |
| License | MIT | MIT* | MIT | **MIT** |

---

## API Reference

### `useTable` — Primary Hook

The single hook that covers 90% of use cases. Every option is optional.

```tsx
const {
  table,          // Full TanStack Table<TData> instance
  pagination,
  sorting,
  globalFilter,
  columnFilters,
  rowSelection,
  columnVisibility,
  rowExpansion,
  grouping,
  emptyState,
} = useTable({
  data,
  columns,

  // Pagination
  pagination: { pageSize: 20 },   // or true (defaults) or false (disabled)

  // Sorting
  sorting: { defaultSort: [{ id: 'name', desc: false }] },  // or true or false

  // Filtering
  globalFilter: true,
  columnFilters: true,

  // Row selection
  rowSelection: true,                          // or { enableMultiRowSelection: false }

  // Column visibility
  columnVisibility: { defaultVisibility: { email: false } },  // or true

  // Row expansion (nested sub-rows)
  rowExpansion: { getSubRows: (row) => row.children },        // or true

  // Row grouping
  grouping: { defaultGrouping: ['role'] },     // or true

  // Fuzzy search (requires match-sorter)
  fuzzy: true,

  // State persistence
  persist: 'localStorage',   // or 'sessionStorage'
  persistKey: 'my-table',
  persistOptions: { sorting: true, pagination: true },

  // URL state sync
  syncUrl: true,   // or { keys: { page: 'p', sort: 's' }, mode: 'replace' }
})
```

**`pagination` return:**

| Property | Type | Description |
|---|---|---|
| `pageIndex` | `number` | Current page (0-indexed) |
| `pageSize` | `number` | Rows per page |
| `pageCount` | `number` | Total pages |
| `canPreviousPage` | `boolean` | Can go back |
| `canNextPage` | `boolean` | Can go forward |
| `previousPage` | `() => void` | Go to previous page |
| `nextPage` | `() => void` | Go to next page |
| `setPageIndex` | `(index: number) => void` | Jump to page |
| `setPageSize` | `(size: number) => void` | Change page size |

**`sorting` return:**

| Property | Type | Description |
|---|---|---|
| `sortingState` | `SortingState` | Current sort state |
| `setSorting` | `OnChangeFn<SortingState>` | Set sort state directly |
| `clearSorting` | `() => void` | Clear all sorting |

**`rowSelection` return:**

| Property | Type | Description |
|---|---|---|
| `state` | `RowSelectionState` | Current selection map |
| `toggleRow` | `(rowId: string) => void` | Toggle a row |
| `toggleAll` | `() => void` | Select / deselect all |
| `clearSelection` | `() => void` | Clear all |
| `selectedRowIds` | `string[]` | IDs of selected rows |
| `selectedCount` | `number` | Number selected |
| `isSelected` | `(rowId: string) => boolean` | Check if selected |

**`rowExpansion` return:**

| Property | Type | Description |
|---|---|---|
| `state` | `ExpandedState` | Current expanded rows |
| `toggleRow` | `(rowId: string) => void` | Toggle expand |
| `expandRow` | `(rowId: string) => void` | Expand a row |
| `collapseRow` | `(rowId: string) => void` | Collapse a row |
| `clearExpansion` | `() => void` | Collapse all |
| `expandedRowIds` | `string[]` | IDs of expanded rows |
| `isExpanded` | `(rowId: string) => boolean` | Check if expanded |

**`grouping` return:**

| Property | Type | Description |
|---|---|---|
| `state` | `GroupingState` | Current grouped columns |
| `toggleGrouping` | `(columnId: string) => void` | Toggle group by column |
| `setGrouping` | `(cols: GroupingState) => void` | Set grouping directly |
| `clearGrouping` | `() => void` | Remove all grouping |
| `isGrouped` | `(columnId: string) => boolean` | Check if grouped |
| `groupedColumns` | `string[]` | Currently grouped column IDs |

**`emptyState` return:**

| Property | Type | Description |
|---|---|---|
| `isEmpty` | `boolean` | True when data has 0 rows total |
| `isFilteredEmpty` | `boolean` | True when filters return 0 rows |

---

### `createColumns` — Column Definition Helper

Type-safe column definitions without `useMemo` or manual type annotations.

```tsx
import { createColumns } from '@marvinackerman/tablecraft'

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <button onClick={() => editable.startEditing(row.id)}>Edit</button>,
  },
])
```

---

### `inferColumns` — Auto Column Inference

Automatically infers column definitions from your data shape.

```tsx
import { inferColumns } from '@marvinackerman/tablecraft'

const columns = inferColumns(users, {
  exclude: ['id'],
  headers: { name: 'Full Name', role: 'Role' },
})
```

---

### `useServerTable` — Server-side Tables

Forces `manualPagination` and `manualSorting` to `true`. Use when your backend owns sorting, filtering, and pagination.

```tsx
import { useServerTable } from '@marvinackerman/tablecraft'

const { table, pagination, sorting } = useServerTable({
  data: serverData,       // current page from your API
  columns,
  rowCount: totalRows,    // required — total rows in the dataset
  pagination: { pageSize: 20 },
  onPaginationChange: (updater) => {
    const next = typeof updater === 'function' ? updater(currentState) : updater
    refetch({ page: next.pageIndex, pageSize: next.pageSize })
  },
  onSortingChange: (updater) => {
    const next = typeof updater === 'function' ? updater(currentSort) : updater
    refetch({ sort: next })
  },
})
```

---

### `useQueryTable` — TanStack Query Integration

Combines `useServerTable` with TanStack Query. Automatically re-fetches when sort, page, or filter state changes.

```tsx
import { useQueryTable } from '@marvinackerman/tablecraft'

const { table, pagination, sorting, query } = useQueryTable({
  queryKey: ['users'],
  queryFn: async ({ pagination, sorting, globalFilter, columnFilters }) => {
    const res = await api.getUsers({
      page: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sort: sorting,
      search: globalFilter,
    })
    return { data: res.data, rowCount: res.total }
  },
  columns,
  pagination: { pageSize: 20 },
  sorting: true,
  globalFilter: true,
})
```

`query` is the raw TanStack Query result (`isLoading`, `isError`, `isFetching`, `error`, `refetch`, etc.).

Requires `@tanstack/react-query` to be installed:
```
npm i @tanstack/react-query
```

---

### `useInfiniteTable` — Infinite Scroll / Load More

Cursor-based infinite scroll powered by TanStack Query's `useInfiniteQuery`. Pages are accumulated in a flat list — no pagination controls needed. When sort or filter state changes, accumulated pages automatically reset to page 1 via query key composition.

```tsx
import { useInfiniteTable } from '@marvinackerman/tablecraft'

const { table, loadMore, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteTable({
  queryKey: ['users'],
  initialPageParam: null as string | null,  // TCursor inferred as string | null
  queryFn: async ({ pageParam, sorting, globalFilter }) => {
    const res = await api.getUsers({
      cursor: pageParam,   // pageParam: string | null — fully typed ✓
      sort: sorting,
      search: globalFilter,
    })
    return {
      data: res.data,
      nextCursor: res.nextCursor,   // string | null | undefined — typed ✓
    }
  },
  columns,
  sorting: true,
  globalFilter: true,
})

// In your JSX:
<button onClick={loadMore} disabled={!hasNextPage || isFetchingNextPage}>
  {isFetchingNextPage ? 'Loading…' : 'Load more'}
</button>
```

All rows across every loaded page are available in `table.getRowModel().rows` as a single flat list — no page tracking on your end.

**`queryFn` context:**

| Property | Type | Description |
|---|---|---|
| `pageParam` | `unknown` | Cursor/offset passed to your API. Type is controlled by your `nextCursor` return value |
| `sorting` | `SortingState` | Current sort |
| `columnFilters` | `ColumnFiltersState` | Current column filter values |
| `globalFilter` | `string` | Current global search string |
| `grouping` | `GroupingState` | Current grouping columns |

**Return:**

| Property | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | Full TanStack Table instance with all accumulated rows |
| `loadMore` | `() => void` | Fetch the next page |
| `hasNextPage` | `boolean` | `true` when `nextCursor` was returned from the last page |
| `isFetchingNextPage` | `boolean` | `true` while a `loadMore` call is in-flight |
| `isLoading` | `boolean` | `true` on the very first fetch |
| `isError` | `boolean` | `true` if the query threw |
| `error` | `Error \| null` | The thrown error, if any |
| `refetch` | `() => void` | Re-run the query from the beginning |
| `sorting` | `SortingReturn` | Same shape as `useTable` |
| `globalFilter` | `GlobalFilterReturn` | Same shape as `useTable` |
| `columnFilters` | `ColumnFiltersReturn` | Same shape as `useTable` |
| `rowSelection` | `RowSelectionReturn` | Opt-in — pass `rowSelection: true` |
| `columnVisibility` | `ColumnVisibilityReturn` | Opt-in — pass `columnVisibility: true` |
| `grouping` | `GroupingReturn` | Opt-in — pass `grouping: true` |
| `emptyState` | `EmptyStateReturn` | Same shape as `useTable` |

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `queryKey` | `unknown[]` | required | TanStack Query cache key |
| `queryFn` | `(ctx) => Promise<{ data, nextCursor? }>` | required | Fetcher — return `nextCursor: undefined` to signal last page |
| `columns` | `ColumnDef[]` | required | Column definitions |
| `initialPageParam` | `unknown` | `0` | First value passed as `pageParam` |
| `sorting` | `boolean \| SortingOptions` | `true` | Enable sorting |
| `globalFilter` | `boolean` | `true` | Enable global search |
| `columnFilters` | `boolean` | `true` | Enable column filters |
| `rowSelection` | `boolean \| RowSelectionOptions` | `false` | Enable row selection |
| `columnVisibility` | `boolean \| ColumnVisibilityOptions` | `false` | Enable column visibility |
| `grouping` | `boolean \| GroupingOptions` | `false` | Enable row grouping |
| `staleTime` | `number` | — | TanStack Query `staleTime` |
| `gcTime` | `number` | — | TanStack Query `gcTime` |
| `enabled` | `boolean` | — | TanStack Query `enabled` |

Requires `@tanstack/react-query`:
```
npm i @tanstack/react-query
```

---

### `useInfiniteScroll` — Automatic Scroll Wiring

Pairs with `useInfiniteTable` to trigger `loadMore` automatically when a sentinel element enters the viewport. Handles observer cleanup, reconnect, and stale-ref prevention internally.

```tsx
import { useInfiniteScroll } from '@marvinackerman/tablecraft'

const { table, loadMore, hasNextPage, isFetchingNextPage } = useInfiniteTable({ ... })

const sentinelRef = useInfiniteScroll(loadMore, {
  enabled: hasNextPage && !isFetchingNextPage,  // never double-fires
})

return (
  <>
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>...</tr>
        ))}
      </tbody>
    </table>

    {/* Place sentinel below the last row — fires loadMore as it scrolls into view */}
    <div ref={sentinelRef} />

    {isFetchingNextPage && <p>Loading more…</p>}
  </>
)
```

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Pass `hasNextPage && !isFetchingNextPage` to prevent double-firing |
| `rootMargin` | `string` | `'0px'` | Load ahead of scroll position — e.g. `'200px'` triggers before the sentinel is fully visible |

---

### `useTableA11y` — ARIA + Keyboard Navigation

Standalone opt-in hook. Returns prop-getter objects to spread onto your table elements, implementing the [WAI-ARIA Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

```tsx
import { useTableA11y } from '@marvinackerman/tablecraft'

const { table } = useTable({ data, columns })
const a11y = useTableA11y(table, {
  selectionEnabled: true,  // adds aria-selected to row props
})

// Spread onto your elements:
<table {...a11y.getTableProps()} />
  // role="grid", aria-rowcount, aria-colcount

<th {...a11y.getHeaderProps(header.id)} />
  // role="columnheader", aria-sort="ascending"|"descending"|"none"

<tr {...a11y.getRowProps(row.id)} />
  // role="row", aria-rowindex, tabIndex, onKeyDown (ArrowUp/Down/Home/End)
  // aria-selected (when selectionEnabled), aria-expanded (when expandable)

<td {...a11y.getCellProps(cellIndex)} />
  // role="gridcell", aria-colindex

// Current focused row index (for custom focus ring styling):
a11y.focusedRowIndex  // number | null
```

**Keyboard navigation** (applied automatically via `onKeyDown` on row props):

| Key | Action |
|-----|--------|
| `ArrowDown` | Move focus to next row |
| `ArrowUp` | Move focus to previous row |
| `Home` | Move focus to first row |
| `End` | Move focus to last row |
| `Enter` / `Space` | Toggle row selection (when `selectionEnabled`) |

---

### `useEditableRows` — Inline Editing

Standalone opt-in hook for single-row inline editing. No form library required — works with Zod, Yup, or plain validation.

```tsx
import { useEditableRows } from '@marvinackerman/tablecraft'

const { table } = useTable({ data, columns })
const editable = useEditableRows(table, {
  onSave: async (rowId, draft) => {
    // Return an error map to show validation errors and stay in edit mode
    if (!draft.name) return { name: 'Name is required' }

    // Or use any schema library
    const result = schema.safeParse(draft)
    if (!result.success) return formatErrors(result.error)

    // Return nothing (or undefined) to commit and exit edit mode
    await api.updateUser(rowId, draft)
  },
})
```

**Return:**

| Property | Type | Description |
|---|---|---|
| `editingRowId` | `string \| null` | Which row is being edited |
| `draftData` | `Partial<TData>` | Current draft field values |
| `isDirty` | `boolean` | Whether any field has changed |
| `dirtyFields` | `(keyof TData)[]` | Which fields changed |
| `errors` | `Partial<Record<keyof TData, string>>` | Field-level validation errors |
| `isSaving` | `boolean` | True while `onSave` promise is in flight |
| `isEditing` | `(rowId: string) => boolean` | Check if a row is in edit mode |
| `startEditing` | `(rowId: string) => void` | Enter edit mode (snapshots original) |
| `setField` | `(field, value) => void` | Update a draft field |
| `saveEditing` | `() => Promise<void>` | Run `onSave`, commit or show errors |
| `cancelEditing` | `() => void` | Discard changes, exit edit mode |

**Usage in rows:**

```tsx
{table.getRowModel().rows.map((row) => (
  <tr key={row.id}>
    {editable.isEditing(row.id) ? (
      <>
        <td>
          <input
            value={editable.draftData.name ?? ''}
            onChange={(e) => editable.setField('name', e.target.value)}
          />
          {editable.errors.name && <span>{editable.errors.name}</span>}
        </td>
        <td>
          <button onClick={editable.saveEditing}>Save</button>
          <button onClick={editable.cancelEditing}>Cancel</button>
        </td>
      </>
    ) : (
      <>
        <td>{row.original.name}</td>
        <td>
          <button onClick={() => editable.startEditing(row.id)}>Edit</button>
        </td>
      </>
    )}
  </tr>
))}
```

---

### `TableKitProvider` — Global Defaults

Set defaults for all tables in your app. Per-call options always override provider defaults.

```tsx
import { TableKitProvider } from '@marvinackerman/tablecraft'

function App() {
  return (
    <TableKitProvider
      defaults={{
        pageSize: 25,
        sorting: true,
        globalFilter: true,
        persist: 'localStorage',
      }}
    >
      <YourApp />
    </TableKitProvider>
  )
}
```

---

### State Persistence

Persist table state across page reloads via `localStorage` or `sessionStorage`.

```tsx
const { table } = useTable({
  data,
  columns,
  persist: 'localStorage',
  persistKey: 'users-table',       // unique key per table
  persistOptions: {
    sorting: true,
    pagination: true,
    globalFilter: false,
    columnFilters: false,
  },
})
```

Utilities for manual control:

```tsx
import { savePersistedState, loadPersistedState, clearPersistedState } from '@marvinackerman/tablecraft'

savePersistedState('my-key', state, 'localStorage')
loadPersistedState('my-key', 'localStorage')
clearPersistedState('my-key', 'localStorage')
```

---

### URL State Sync

Sync table state (page, sort, filters) to the URL. Works with any router.

```tsx
const { table } = useTable({
  data,
  columns,
  syncUrl: true,
  // or with custom keys:
  syncUrl: {
    keys: { page: 'p', pageSize: 'ps', sort: 's', filter: 'q' },
    mode: 'replace',   // or 'push' (adds browser history entry)
  },
})
```

---

### Granular Hooks

For advanced setups where you compose your own `useReactTable` call:

```tsx
import {
  useSortState,
  usePaginationState,
  useFilterState,
  useColumnFilterState,
  useRowSelectionState,
  useColumnVisibilityState,
  useRowExpansionState,
  useGroupingState,
  useColumnPinningState,
} from '@marvinackerman/tablecraft'

const sorting = useSortState({ defaultSort: [{ id: 'createdAt', desc: true }] })
const pagination = usePaginationState({ pageSize: 25 })
const globalFilter = useFilterState()
const columnFilters = useColumnFilterState()
const rowSelection = useRowSelectionState()
const columnVisibility = useColumnVisibilityState({ defaultVisibility: { id: false } })
const rowExpansion = useRowExpansionState({ allowMultiple: false })
const grouping = useGroupingState({ defaultGrouping: ['department'] })
```

Each hook returns state + setters compatible with TanStack Table's `state` and `on*Change` props.

---

### Column Pinning

Pin columns to the left or right edge. TanStack Table provides the pixel offsets — your CSS does the sticking.

```tsx
const { table, columnPinning } = useTable({
  data,
  columns,
  columnPinning: true,
  // or: columnPinning: { defaultPinning: { left: ['id'] } }
})

// Actions
columnPinning.pinLeft('name')
columnPinning.pinRight('email')
columnPinning.unpin('name')
columnPinning.clearPinning()
columnPinning.isPinned('name')   // → 'left' | 'right' | false
columnPinning.leftColumns        // → ['id']
columnPinning.rightColumns       // → ['email']

// Render with sticky CSS
{table.getHeaderGroups().map(headerGroup => (
  <tr key={headerGroup.id}>
    {(['left', 'center', 'right'] as const).flatMap(position =>
      (position === 'left'
        ? table.getLeftLeafHeaders()
        : position === 'right'
        ? table.getRightLeafHeaders()
        : table.getCenterLeafHeaders()
      ).map(header => (
        <th
          key={header.id}
          style={{
            position: header.column.getIsPinned() ? 'sticky' : 'relative',
            left:  header.column.getIsPinned() === 'left'
              ? `${header.column.getStart('left')}px`
              : undefined,
            right: header.column.getIsPinned() === 'right'
              ? `${header.column.getAfter('right')}px`
              : undefined,
            zIndex: header.column.getIsPinned() ? 1 : 0,
            background: 'white',
          }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
        </th>
      ))
    )}
  </tr>
))}
```

> `position: sticky` is all CSS. Tablecraft provides the state and pixel offsets (`getStart`, `getAfter`). Your styles do the rest — no UI lock-in.

Also works in `useQueryTable` and `useInfiniteTable` with the same `columnPinning` option.

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columnPinning` | `boolean \| ColumnPinningOptions` | `false` | Opt-in column pinning. Pass `true` to enable with defaults, or an object to configure. |

**`ColumnPinningOptions` properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultPinning` | `{ left?: string[], right?: string[] }` | `{}` | Columns pinned on mount |

**`columnPinning` return**

| Property | Type | Description |
|----------|------|-------------|
| `state` | `ColumnPinningState` | Raw TanStack state |
| `pinLeft(id)` | `fn` | Pin column to left edge |
| `pinRight(id)` | `fn` | Pin column to right edge |
| `unpin(id)` | `fn` | Remove pin from column |
| `clearPinning()` | `fn` | Unpin all columns |
| `isPinned(id)` | `fn → 'left' \| 'right' \| false` | Query pin status |
| `leftColumns` | `string[]` | Currently left-pinned column IDs |
| `rightColumns` | `string[]` | Currently right-pinned column IDs |

---

### Devtools

A floating debug panel showing current table state — sorting, pagination, filters, selection, expansion, grouping. Zero-config, dev-only.

```tsx
import { TablecraftDevtools } from '@marvinackerman/tablecraft/devtools'

function MyTable() {
  const { table } = useTable({ data, columns })

  return (
    <>
      {/* your table */}
      {process.env.NODE_ENV === 'development' && (
        <TablecraftDevtools table={table} />
      )}
    </>
  )
}
```

---

### Testing Utilities

Helpers for testing tables in Vitest / Jest without boilerplate.

```tsx
import { renderTable } from '@marvinackerman/tablecraft/testing'

const { table, pagination, sorting } = renderTable({
  data: users,
  columns,
  pagination: true,
  sorting: true,
})
```

Requires `@testing-library/react`:
```
npm i -D @testing-library/react
```

---

## TypeScript

tablecraft is written in strict TypeScript with full generics. Your data type flows through the entire API:

```tsx
type Product = { id: number; name: string; price: number }

const columns = createColumns<Product>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price', header: 'Price' },
])

// table is Table<Product>, row.original is Product
const { table } = useTable<Product>({ data: products, columns })
```

---

## FAQ

**Does this impose any styles?**
No. tablecraft is 100% headless. Bring your own CSS, Tailwind, shadcn/ui, or anything else.

**Can I use the raw TanStack Table instance?**
Yes. `useTable` returns the full `Table<TData>` instance as `table`. Use it for anything tablecraft doesn't cover.

**Does it work with shadcn/ui?**
Yes. shadcn's data table is built on TanStack Table. Replace the boilerplate with `useTable` and keep your shadcn components.

**Does it work with Next.js App Router?**
Yes. All hooks include `"use client"` directives. `createColumns` and `inferColumns` are pure functions that work anywhere.

**What's the bundle size?**
~21 KB ESM before gzip — ~6 KB for tablecraft itself plus ~15 KB for `@tanstack/react-table`, which you'd need anyway. Compare that to AG Grid (~300 KB) or Material React Table (~50 KB).

**Does it support React 19?**
Yes. Tested against React 18 and 19.

---

## Optional Peer Dependencies

| Package | Feature |
|---------|---------|
| `match-sorter` | Fuzzy search (`fuzzy: true` on `useTable`) |
| `@tanstack/react-query` | `useQueryTable` |
| `@testing-library/react` | `tablecraft/testing` utilities |

---

## Roadmap

- **v2**  — Row expansion, grouping + aggregation, ARIA + keyboard navigation, inline editing, TanStack Query integration (`useQueryTable`), URL state sync, state persistence, devtools, testing utilities
- **v2.1** — Infinite scroll (`useInfiniteTable`)
- **v3** — Column pinning, multi-row editing, Zod column schemas, CLI scaffold

---

## License

MIT

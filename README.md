# tablecraft

> Batteries-included [TanStack Table](https://tanstack.com/table) wrapper for React. TypeScript-first, headless, zero UI lock-in.

**Go from ~100 lines of TanStack Table boilerplate to ~10 lines.** No CSS. No component library. Full escape hatch to the raw table instance.

```
npm i tablecraft @tanstack/react-table
```

## Quick Start

```tsx
import { useTable, createColumns } from 'tablecraft'
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
    sorting: { defaultSort: [{ id: 'name', desc: false }] },
  })

  return (
    <div>
      {/* Search */}
      <input
        placeholder="Search..."
        value={globalFilter.value}
        onChange={(e) => globalFilter.setValue(e.target.value)}
      />

      {/* Table */}
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

      {/* Pagination */}
      <div>
        <button onClick={pagination.previousPage} disabled={!pagination.canPreviousPage}>
          Previous
        </button>
        <span>Page {pagination.pageIndex + 1} of {pagination.pageCount}</span>
        <button onClick={pagination.nextPage} disabled={!pagination.canNextPage}>
          Next
        </button>
      </div>
    </div>
  )
}
```

That's it. Sorting, pagination, global search, and full TypeScript generics — all wired up.

## Why tablecraft?

`@tanstack/react-table` is intentionally 100% headless. That's its strength, but it means every project starts with 80-150 lines of identical boilerplate: `useState` for sorting, `useState` for pagination, `useState` for filters, `useMemo` for columns, manual row model wiring...

**tablecraft eliminates the boilerplate without taking away control.** You get sensible defaults, and the full TanStack Table instance is always available as an escape hatch.

| Feature | TanStack Table | AG Grid | Material React Table | **tablecraft** |
|---|---|---|---|---|
| Headless (no CSS) | Yes | No | No | **Yes** |
| Zero boilerplate | No | Yes | Yes | **Yes** |
| TypeScript-first | Yes | Yes | Yes | **Yes** |
| State persistence | No | Enterprise $$ | No | **Free** |
| Bundle size | ~15 KB | ~300 KB | ~50 KB | **~6 KB** |
| License | MIT | MIT* | MIT | **MIT** |

## API Reference

### `useTable` — Primary Hook

The single hook that covers 90% of use cases.

```tsx
const { table, pagination, sorting, globalFilter, columnFilters } = useTable({
  data,
  columns,

  // All optional
  pagination: { pageSize: 10 },                              // or `true` (default) or `false`
  sorting: { defaultSort: [{ id: 'name', desc: false }] },   // or `true` (default) or `false`
  globalFilter: true,                                         // default: true
  columnFilters: true,                                        // default: true

  // Server-side control
  manualPagination: false,
  manualSorting: false,
  rowCount: undefined,
  onPaginationChange: undefined,
  onSortingChange: undefined,
  onGlobalFilterChange: undefined,
  onColumnFiltersChange: undefined,
})
```

**Returns:**

| Property | Type | Description |
|---|---|---|
| `table` | `Table<TData>` | Full TanStack Table instance (escape hatch) |
| `pagination.pageIndex` | `number` | Current page (0-indexed) |
| `pagination.pageSize` | `number` | Rows per page |
| `pagination.pageCount` | `number` | Total pages |
| `pagination.canPreviousPage` | `boolean` | Can navigate backward |
| `pagination.canNextPage` | `boolean` | Can navigate forward |
| `pagination.previousPage` | `() => void` | Go to previous page |
| `pagination.nextPage` | `() => void` | Go to next page |
| `pagination.setPageIndex` | `(index: number) => void` | Jump to specific page |
| `pagination.setPageSize` | `(size: number) => void` | Change page size (resets to page 0) |
| `sorting.sortingState` | `SortingState` | Current sort state |
| `sorting.setSorting` | `OnChangeFn<SortingState>` | Set sort state |
| `sorting.clearSorting` | `() => void` | Clear all sorting |
| `globalFilter.value` | `string` | Current filter value |
| `globalFilter.setValue` | `(val: string) => void` | Set filter value |
| `globalFilter.clear` | `() => void` | Clear filter |
| `columnFilters.state` | `ColumnFiltersState` | Current column filters |
| `columnFilters.setFilter` | `(columnId: string, value: unknown) => void` | Set a column filter |
| `columnFilters.clearFilter` | `(columnId: string) => void` | Clear one column filter |
| `columnFilters.clearAll` | `() => void` | Clear all column filters |

### `createColumns` — Column Definition Helper

Type-safe column definitions without `useMemo` or manual type annotations.

```tsx
import { createColumns } from 'tablecraft'

type User = { id: number; name: string; email: string }

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  { id: 'actions', header: 'Actions', cell: ({ row }) => <button>Edit</button> },
])
```

### `useServerTable` — Server-side Tables

A semantic wrapper over `useTable` with `manualPagination` and `manualSorting` forced to `true`. Use this when your backend handles sorting, filtering, and pagination.

```tsx
import { useServerTable } from 'tablecraft'

const { table, pagination, sorting } = useServerTable({
  data: serverData,          // current page from your API
  columns,
  rowCount: totalRows,       // required — total rows from your API
  pagination: { pageSize: 20 },
  onPaginationChange: (state) => refetch({ page: state }),
  onSortingChange: (state) => refetch({ sort: state }),
})
```

### Granular Hooks

For developers who want to compose their own table setup:

```tsx
import { useSortState, usePaginationState, useFilterState, useColumnFilterState } from 'tablecraft'

const sorting = useSortState({ defaultSort: [{ id: 'createdAt', desc: true }] })
const pagination = usePaginationState({ pageSize: 25 })
const filter = useFilterState()
const columnFilters = useColumnFilterState()
```

Each returns state + setters compatible with TanStack Table's `state` and `on*Change` props.

## TypeScript

tablecraft is written in strict TypeScript with full generics. Your data type flows through the entire API:

```tsx
type Product = { id: number; name: string; price: number }

// `columns` is typed as ColumnDef<Product>[]
const columns = createColumns<Product>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'price', header: 'Price' },
])

// `table` is typed as Table<Product>
// `row.original` is typed as Product
const { table } = useTable<Product>({ data: products, columns })
```

## FAQ

**Does this impose any styles?**
No. tablecraft is 100% headless. Bring your own CSS, Tailwind, shadcn/ui, or anything else.

**Can I use the raw TanStack Table instance?**
Yes. `useTable` returns the full `Table<TData>` instance as `table`. Use it for anything tablecraft doesn't cover.

**Does it work with shadcn/ui?**
Yes. shadcn's data table is built on TanStack Table. Replace the boilerplate with `useTable` and keep the shadcn components.

**Does it work with Next.js App Router?**
Yes. All hooks include `"use client"` directives. `createColumns` is a pure function that works anywhere.

**What's the bundle size?**
~6 KB (ESM, before gzip). The only peer dependencies are `react` and `@tanstack/react-table`.

## Roadmap

- **v1.x** — `inferColumns`, state persistence (`localStorage`/`sessionStorage`), fuzzy search via `match-sorter`, empty state helpers
- **v2** — `useQueryTable` (TanStack Query integration), URL state sync, virtualization, devtools, testing utilities, accessibility
- **v3** — `useInfiniteTable`, Zod column schemas, column pinning, CLI scaffold

## License

MIT

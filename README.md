# tablecraft

[![CI](https://github.com/Marvinkwame/Tablecraft/actions/workflows/ci.yml/badge.svg)](https://github.com/Marvinkwame/Tablecraft/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40marvinackerman%2Ftablecraft)](https://www.npmjs.com/package/@marvinackerman/tablecraft)

> Batteries-included [TanStack Table](https://tanstack.com/table) wrapper for React. TypeScript-first, headless, zero UI lock-in.

tablecraft collapses the 80–150 lines of `useState`/`useMemo` boilerplate that every TanStack Table project rewrites into a single hook call — without taking away control. You get sensible defaults for sorting, pagination, and filtering, and the full TanStack Table instance is always available as an escape hatch. There's no bundled CSS and no component library, so tablecraft never fights your design system.

**[Documentation](https://tablecraft-g1vu.vercel.app/docs)** · **[Live demo](https://tablecraft-seven.vercel.app/)**

## Install

```
npm i @marvinackerman/tablecraft
```

`@tanstack/react-table` (`^8`) and `react` (`>=18`) are the only required peers, and npm installs them for you. Everything else is optional and lives behind its own entry point, so you install it only when you reach for the feature it backs:

| Optional peer | Entry it backs |
|---|---|
| `@tanstack/react-query` | `tablecraft/query` — `useQueryTable`, `useInfiniteTable` |
| `@tanstack/react-virtual` (`>=3`) | `tablecraft/virtual` — `useVirtualRows` |
| `zod` (`>=3.23.0`) | `tablecraft/zod` — `columnsFromZod`, `zodValidator` |
| `match-sorter` | Fuzzy search (`fuzzy: true`) |

See the [installation guide](https://tablecraft-g1vu.vercel.app/docs/installation) for version ranges and details.

## Quick start

```tsx
import { useTable, createColumns } from '@marvinackerman/tablecraft'
import { flexRender } from '@tanstack/react-table'

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'age', header: 'Age' },
])

function UsersTable({ users }: { users: User[] }) {
  const { table } = useTable<User>({ data: users, columns })
  // render table.getHeaderGroups() / table.getRowModel() with flexRender
}
```

Sorting, pagination, global search, and full TypeScript generics are all wired up in one call — see the [Getting Started](https://tablecraft-g1vu.vercel.app/docs) guide for the complete rendered example.

## What's inside

- **[Getting Started](https://tablecraft-g1vu.vercel.app/docs)** — installation, mental model, first table
- **[Installation](https://tablecraft-g1vu.vercel.app/docs/installation)** — required and optional peer dependencies
- **[API Reference](https://tablecraft-g1vu.vercel.app/docs/api/use-table)** — `useTable`, `useServerTable`, `useQueryTable`, `useInfiniteTable`, `useVirtualRows`, `useEditableRows`, `useMultiRowEditing`, `useTableA11y`, `useTableExport`, column pinning, devtools, testing utilities, and more
- **[Guides](https://tablecraft-g1vu.vercel.app/docs/guides/inline-editing)** — server-side tables, inline editing
- **[Zod-driven columns](https://tablecraft-g1vu.vercel.app/docs/api/zod)** — derive columns and edit validation from a single schema
- **[Live examples](https://tablecraft-g1vu.vercel.app/docs)** — interactive tables rendered directly in the docs

> **Using shadcn/ui?** Its data table is built on TanStack Table. Swap the boilerplate for `useTable` and keep every one of your components — tablecraft ships zero markup and zero styles.

## License

MIT

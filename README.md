# tablecraft

[![CI](https://github.com/Marvinkwame/Tablecraft/actions/workflows/ci.yml/badge.svg)](https://github.com/Marvinkwame/Tablecraft/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40marvinackerman%2Ftablecraft)](https://www.npmjs.com/package/@marvinackerman/tablecraft)

> Batteries-included [TanStack Table](https://tanstack.com/table) wrapper for React. TypeScript-first, headless, zero UI lock-in.

tablecraft collapses the 80–150 lines of `useState`/`useMemo` boilerplate that every TanStack Table project rewrites into a single hook call — without taking away control. You get sensible defaults for sorting, pagination, and filtering, and the full TanStack Table instance is always available as an escape hatch. There's no bundled CSS and no component library, so tablecraft never fights your design system.

**Full docs, guides, and live examples: <!-- TODO: replace with deployed docs URL --> [Live example>](https://tablecraft-seven.vercel.app/)**
**Docs: [Docs site](https://tablecraft-g1vu.vercel.app/docs)**

## Install

```
npm i @marvinackerman/tablecraft @tanstack/react-table@">=8" @tanstack/react-virtual@">=3" react@">=18" react-dom@">=18"
```

`@tanstack/react-table`, `react`/`react-dom`, and `@tanstack/react-virtual` are all required peers — the core entry statically imports react-virtual. Optional peers, installed only as you reach for the feature they back: `zod` (`>=3.23.0`, for the `tablecraft/zod` entry), `@tanstack/react-query` (for `useQueryTable`/`useInfiniteTable`), and `match-sorter` (fuzzy search). See the [Installation guide](https://<docs-site-url>/docs/installation) for details.

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

Sorting, pagination, global search, and full TypeScript generics are all wired up in one call — see the [Getting Started](https://<docs-site-url>/docs) guide for the complete rendered example.

## What's inside

- **[Getting Started](https://<docs-site-url>/docs)** — installation, mental model, first table
- **[Installation](https://<docs-site-url>/docs/installation)** — required and optional peer dependencies
- **[API Reference](https://<docs-site-url>/docs/api/use-table)** — `useTable`, `useServerTable`, `useQueryTable`, `useInfiniteTable`, `useVirtualRows`, `useEditableRows`, `useMultiRowEditing`, `useTableA11y`, column pinning, devtools, testing utilities, and more
- **[Guides](https://<docs-site-url>/docs/guides/inline-editing)** — server-side tables, inline editing
- **[Zod-driven columns](https://<docs-site-url>/docs/api/zod)** — derive columns and edit validation from a single schema
- **[Live examples](https://<docs-site-url>/docs)** — interactive tables rendered directly in the docs

> **Using shadcn/ui?** Its data table is built on TanStack Table. Swap the boilerplate for `useTable` and keep every one of your components — tablecraft ships zero markup and zero styles.

## License

MIT

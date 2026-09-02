# Changelog

All notable changes to tablecraft are documented here.

---

## [3.1.0] — 2026-09-02

### Fixed

- **`aria-rowindex` now reports position in the full row set instead of restarting on every page.** It was computed against `getRowModel()` (the current page) while `aria-rowcount` was computed against the whole filtered set, so on page 2 of a paginated grid screen readers announced "row 1 of 50, row 2 of 50…" for rows that were actually 11–20. It now reads `getPrePaginationRowModel()`, which — unlike `getFilteredRowModel()` — also reflects the user's sort rather than the original data order.

- **The roving tabindex now actually moves DOM focus.** `getRowProps` and `getCellProps` return a `ref` to register the element; a keyboard move focuses the newly-current one. Previously only `tabIndex` changed, so a keyboard user pressing `ArrowDown` saw no focus movement at all. Mounting a grid never steals focus — only a keypress moves it.

### Added

- **`cellNavigation` option for `useTableA11y`, providing the 2D keyboard navigation that `role="grid"` advertises.** Off by default, so existing row-level behaviour is unchanged.

  ```tsx
  const a11y = useTableA11y(table, { cellNavigation: true })

  <td {...a11y.getCellProps(columnIndex, row.id)} />
  ```

  When enabled: `ArrowLeft`/`ArrowRight` move by column, `ArrowUp`/`ArrowDown` move by row while keeping the column, `Home`/`End` move to the first/last cell **in the current row**, `Ctrl`+`Home`/`End` move to the first/last cell in the grid, `PageUp`/`PageDown` move ten rows, and `Enter`/`Space` toggle selection of the focused cell's row. The roving tabindex moves from the row to the cell, and the row's `onKeyDown` goes inert so a keypress bubbling from cell to row cannot move twice.

- **`focusedCell`** on the `useTableA11y` return — `{ rowIndex, columnIndex }` when `cellNavigation` is on, otherwise `null`.

- `getCellProps` accepts an optional second `rowId` argument. Calling it with one argument behaves exactly as before.

---

## [3.0.0] — 2026-08-05

### Breaking

- **`useQueryTable` and `useInfiniteTable` moved to a new `@marvinackerman/tablecraft/query` entry point.** They are no longer exported from the package root, along with their types (`UseQueryTableOptions`, `UseQueryTableReturn`, `QueryTableFnContext`, `QueryTableResult`, `QueryState`, `UseInfiniteTableOptions`, `UseInfiniteTableReturn`, `InfiniteTableFnContext`, `InfiniteTableResult`).

  ```diff
  - import { useQueryTable, useInfiniteTable } from '@marvinackerman/tablecraft'
  + import { useQueryTable, useInfiniteTable } from '@marvinackerman/tablecraft/query'
  ```

  `useInfiniteScroll` is unaffected and stays on the root entry — it is a plain `IntersectionObserver` hook with no TanStack Query dependency, so an infinite-scroll setup now imports from both entries.

- **`useVirtualRows` moved to a new `@marvinackerman/tablecraft/virtual` entry point,** along with its types (`VirtualRowsOptions`, `VirtualRow`, `VirtualRowsReturn`), for the same reason.

  ```diff
  - import { useTable, useVirtualRows } from '@marvinackerman/tablecraft'
  + import { useTable } from '@marvinackerman/tablecraft'
  + import { useVirtualRows } from '@marvinackerman/tablecraft/virtual'
  ```

- **`@tanstack/react-virtual` is no longer a required peer dependency.** It was previously declared optional but statically imported by the root entry, so in practice every consumer had to install it — the 2.6.1 README documented it as required for exactly that reason. With `useVirtualRows` behind `/virtual`, it is genuinely optional: `@tanstack/react-table` and `react` are now the only required peers.

### Fixed

- **The root entry is importable again without `@tanstack/react-query` or `@tanstack/react-virtual` installed.** Because the root re-exported `useQueryTable`/`useInfiniteTable`/`useVirtualRows`, the emitted bundle carried static `import '@tanstack/react-query'` and `import '@tanstack/react-virtual'` — and a static import must *resolve* even when tree-shaking drops the code that uses it. Every consumer who never opted into TanStack Query got `ERR_MODULE_NOT_FOUND` (or a bundler resolution error) from `import { useTable } from '@marvinackerman/tablecraft'`, despite react-query being documented as optional. Moving these hooks behind their own entries confines each import to the entry that exists for it; consumers who do not use a feature never resolve its peer, and consumers who do get an error naming the package they need to install.

- **`@tanstack/react-table` is now `^8` instead of `>=8`.** The unbounded range resolved to TanStack Table **v9**, which is now `latest` on npm and renamed the row-model factories (`getCoreRowModel` → `createCoreRowModel`) and moved `useReactTable`. A fresh `npm i @marvinackerman/tablecraft @tanstack/react-table` therefore installed a major tablecraft cannot work with, failing at first import with `does not provide an export named 'getCoreRowModel'`. Local development and CI never saw this because the devDependency is pinned to `^8.17.0`. v9 support is a separate piece of work; until then the range says what is actually true.

- **`match-sorter`, `@tanstack/react-query`, and `@testing-library/react` are now declared in `peerDependencies`.** All three were listed only in `peerDependenciesMeta`. npm applies that block to packages declared in `peerDependencies` — an orphaned key is inert, so these were not optional peers but *undeclared* ones: no install warning, no auto-resolution, and a runtime failure the manifest gave no hint about. Each is declared with a floor matching the API actually used (`@tanstack/react-query@>=5` for `keepPreviousData` and `initialPageParam`, `@testing-library/react@>=14` for `renderHook`, `match-sorter@>=6` for `rankings`) and kept optional via the meta block, which now works.

  Net effect: `npm i @marvinackerman/tablecraft` on its own resolves `react` and `@tanstack/react-table@8`, pulls in none of the optional peers, and imports cleanly.

### Added

- **`scripts/check-entry-deps.mjs`**, run as part of `npm run build`. It walks each published entry's real emitted module graph and enforces three invariants: the root entry never reaches an optional peer; `/query` and `/virtual` still reach theirs (a split that silently drops its feature would otherwise pass); and every package any entry imports is declared in the manifest, with no orphaned `peerDependenciesMeta` keys. The last two would have caught the undeclared-peer bug above on the build that introduced it. This class of bug is invisible to the test suite, which imports source modules directly rather than the built package.

---

## [2.6.1] — 2026-08-04

### Fixed

- **`syncUrl` now round-trips typed column-filter values.** Column filters whose value is an array or object — multi-selects (`["a","b"]`) and numeric-range tuples (`[min, max]`) — were serialized with `String(value)` (`[1,2]` → `"1,2"`, `["a"]` → `"a"`), so they never survived a page reload: on parse they came back as raw strings, silently changing which rows matched. Array/object values are now JSON-encoded on write and parsed back on read; scalar string values stay bare, so existing URLs and behavior are unchanged.

---

## [2.6.0] — 2026-07-23

### Added

- **`@marvinackerman/tablecraft/zod`** — a new subpath export bridging Zod schemas to the table. Requires `zod` (optional peer, supports both Zod 3 (`>=3.23.0`) and Zod 4).
  - **`columnsFromZod(schema, options?)`** — generates headless `{ accessorKey, header }` columns straight from a Zod object schema's top-level fields, no sample data required. Supports `include` / `exclude` / `overrides`, matching `inferColumns`.
  - **`zodValidator(schema, options?)`** — adapts a Zod schema into the `(row) => errors | undefined` shape `useEditableRows` / `useMultiRowEditing` expect. **Invalid rows are never silently committed**: when the schema rejects a value, the returned error map is guaranteed non-empty (an empty map would collapse to `undefined` via the caller's typical `Object.keys(e).length ? e : undefined` check and let the invalid row save). Supports wrapped schemas (`.refine()` / `.superRefine()`); object-level issues are attached to a field via `rootErrorField` (or a documented fallback cascade) so the row stays in edit mode.
  - **`.refine()` behaves differently across Zod majors.** Zod 3 wraps refined schemas so `.shape` is hidden — `columnsFromZod` throws with an actionable message (pass the base object schema, or use `.innerType()`). Zod 4 keeps `.shape`, so refined schemas work with `columnsFromZod` normally. `zodValidator` accepts refined schemas on both majors.

### Fixed

- **`pagination: false` no longer caps rows at the initial data length.** Disabling pagination previously faked a page size equal to `data.length` at mount, so rows added later (e.g. from an async fetch) were silently cut off. The pagination row model is now skipped entirely when pagination is disabled.
- **`fuzzy` now accepts a custom `FilterFn`** (`useTable`, `useQueryTable`), used directly as the global filter function. `fuzzy: true` loads `match-sorter` via `require()`, which is unavailable in ESM-only environments (Vite, browsers) — there it failed silently with a warning that wrongly claimed `match-sorter` wasn't installed. The warning now explains the ESM limitation and recommends passing a filter function.

---

## [2.5.0] — 2026-05-27

### Added

- **`useVirtualRows`** — standalone hook for virtualizing large datasets. Wraps `@tanstack/react-virtual`'s `useVirtualizer` internally — consumers never import from that library directly. Only rows visible in the scroll viewport are rendered as DOM nodes. Supports fixed row height. Works identically with `useTable`, `useQueryTable`, and `useInfiniteTable`. Returns `virtualRows`, `totalHeight`, `containerRef`, and a `scrollToIndex` helper. Requires `@tanstack/react-virtual` (optional peer dependency).

---

## [2.4.0] — 2026-05-26

### Added

- **`useMultiRowEditing`** — standalone hook for editing, validating, and saving multiple rows simultaneously. Manages per-row draft state, dirty tracking, and field-level errors. Supports per-row save (`saveRow` via `onSave`) and bulk save (`saveAll` via `onSaveAll` for a single batch API call, or parallel `onSave` calls when `onSaveAll` is omitted). Rows with validation errors stay in edit mode; clean rows exit automatically.

---

## [2.3.0] — 2026-05-06

### Added

- **Column pinning** (`columnPinning` option on `useTable`, `useQueryTable`, `useInfiniteTable`) — pin columns to the left or right edge. TanStack Table provides pixel offsets (`getStart`, `getAfter`); your CSS handles `position: sticky`. Actions: `pinLeft`, `pinRight`, `unpin`, `clearPinning`, `isPinned`, `leftColumns`, `rightColumns`.
- **`useColumnPinningState`** — standalone column pinning hook for custom table implementations.

---

## [2.0.0] — 2026-04-18

### Added

- **`useQueryTable`** — TanStack Query integration. Automatically re-fetches when sort, page, or filter state changes. Requires `@tanstack/react-query`.
- **`useRowExpansionState`** + `rowExpansion` option on `useTable` — expand/collapse rows to reveal sub-rows via TanStack's `getSubRows`. Supports `allowMultiple: false` to collapse previous row on new expand.
- **`useGroupingState`** + `grouping` option on `useTable` — group rows by column value with built-in aggregation (sum, avg, count, min, max). Groups are expandable.
- **`useTableA11y`** — standalone ARIA + keyboard navigation hook. Implements the WAI-ARIA Grid pattern. Returns prop-getter objects (`getTableProps`, `getHeaderProps`, `getRowProps`, `getCellProps`). Row-level keyboard navigation via ArrowUp/Down/Home/End/Enter/Space.
- **`useEditableRows`** — standalone inline editing hook. Single-row draft state, dirty tracking, field-level validation via `onSave` return value (sync and async). No form library dependency.
- **`inferColumns`** — automatically infer column definitions from your data shape.
- **URL state sync** (`syncUrl` option on `useTable`) — sync sort, page, and filter state to the URL. Works with any router.
- **State persistence** (`persist` option on `useTable`) — persist table state to `localStorage` or `sessionStorage` across page reloads.
- **`TableKitProvider`** — set global defaults (page size, sorting, persistence strategy) for all tables in your app.
- **`tablecraft/devtools`** — floating debug panel showing live table state. Zero-config, dev-only.
- **`tablecraft/testing`** — `renderTable` helper for testing tables in Vitest/Jest without boilerplate.
- **Row selection** (`rowSelection` option on `useTable`) — multi and single row selection with `toggleRow`, `toggleAll`, `selectedRowIds`, `selectedCount`.
- **Column visibility** (`columnVisibility` option on `useTable`) — show/hide columns with `toggleColumn`, `showAll`, `hiddenColumns`.
- **Fuzzy search** (`fuzzy: true` on `useTable`) — fuzzy matching via `match-sorter`. Optional peer dependency.
- **Empty state helpers** (`emptyState` on `useTable`) — `isEmpty` and `isFilteredEmpty` flags.

### Changed

- First stable public release. All APIs are considered stable and follow semver from this version forward.

---

## [0.1.0] — Initial release

- `useTable` — primary client-side hook with pagination, sorting, global filter, column filters
- `useServerTable` — server-controlled pagination and sorting
- `createColumns` — type-safe column definition helper
- Granular hooks: `usePaginationState`, `useSortState`, `useFilterState`, `useColumnFilterState`, `useRowSelectionState`, `useColumnVisibilityState`

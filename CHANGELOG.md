# Changelog

All notable changes to tablecraft are documented here.

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

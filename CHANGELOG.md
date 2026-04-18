# Changelog

All notable changes to tablecraft are documented here.

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

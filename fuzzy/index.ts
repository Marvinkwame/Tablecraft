// Typo-tolerant search, backed by match-sorter.
//
// Lives behind the `/fuzzy` subpath rather than the root entry because it
// statically imports `match-sorter`, an optional peer. Re-exporting it from the
// root would make that import unavoidable for every consumer — a static import
// has to resolve even when tree-shaking drops the code using it.
//
// `useTable`'s `fuzzy: true` keeps its own `require()`-based path on the root
// entry, which works in Node and throws in ESM-only bundlers. This export is
// the path that works everywhere.
export { fuzzyFilterFn } from '../src/utils/fuzzy'

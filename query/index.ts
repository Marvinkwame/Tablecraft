// TanStack Query-backed table hooks.
//
// These live behind the `/query` subpath rather than the root entry because they
// statically import `@tanstack/react-query`, an optional peer. Re-exporting them
// from the root would make that import unavoidable for every consumer — a static
// import has to resolve even when tree-shaking drops the code that uses it.
export { useQueryTable } from '../src/hooks/useQueryTable'
export { useInfiniteTable } from '../src/hooks/useInfiniteTable'

export type {
  UseQueryTableOptions,
  UseQueryTableReturn,
  QueryTableFnContext,
  QueryTableResult,
  QueryState,
  UseInfiniteTableOptions,
  UseInfiniteTableReturn,
  InfiniteTableFnContext,
  InfiniteTableResult,
} from '../src/types/query'

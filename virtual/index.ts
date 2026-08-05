// Row virtualization, backed by TanStack Virtual.
//
// Lives behind the `/virtual` subpath rather than the root entry because it
// statically imports `@tanstack/react-virtual`, an optional peer. Re-exporting
// it from the root would make that import unavoidable for every consumer — a
// static import has to resolve even when tree-shaking drops the code using it.
export { useVirtualRows } from '../src/hooks/useVirtualRows'

export type {
  VirtualRowsOptions,
  VirtualRow,
  VirtualRowsReturn,
} from '../src/types'

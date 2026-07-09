import { CodeBlock } from './ui/CodeBlock'

type Feature = { title: string; blurb: string; code: string }

const FEATURES: Feature[] = [
  {
    title: 'Column pinning',
    blurb: 'Freeze columns to either edge.',
    code: `const { columnPinning } = useTable({
  data, columns, columnPinning: true,
})
columnPinning.pinLeft('name')`,
  },
  {
    title: 'Row grouping & aggregation',
    blurb: 'Group rows by any column.',
    code: `const { grouping } = useTable({
  data, columns, grouping: true,
})
grouping.toggleGrouping('department')`,
  },
  {
    title: 'Expandable sub-rows',
    blurb: 'Nested, collapsible child rows.',
    code: `useTable({
  data, columns,
  rowExpansion: { getSubRows: (r) => r.children },
})`,
  },
  {
    title: 'URL state sync',
    blurb: 'Sort/page/filter live in the URL.',
    code: `useTable({ data, columns, syncUrl: true })
// → ?page=2&sort=name&q=ava`,
  },
  {
    title: 'localStorage persistence',
    blurb: 'State survives reloads.',
    code: `useTable({
  data, columns,
  persist: 'localStorage', persistKey: 'users',
})`,
  },
  {
    title: 'ARIA + keyboard nav',
    blurb: 'WAI-ARIA grid, prop getters.',
    code: `const a11y = useTableA11y(table, {
  selectionEnabled: true,
})
<tr {...a11y.getRowProps(row.id)} />`,
  },
  {
    title: 'TanStack Query',
    blurb: 'Server data, auto refetch.',
    code: `const { table, query } = useQueryTable({
  queryKey: ['users'], queryFn, columns,
})`,
  },
  {
    title: 'Infinite scroll',
    blurb: 'Cursor paging + sentinel wiring.',
    code: `const { loadMore, hasNextPage } =
  useInfiniteTable({ queryKey, queryFn, columns })
const ref = useInfiniteScroll(loadMore, { enabled: hasNextPage })`,
  },
  {
    title: 'Devtools panel',
    blurb: 'Inspect live table state.',
    code: `import { TablecraftDevtools } from
  '@marvinackerman/tablecraft/devtools'

<TablecraftDevtools table={table} />`,
  },
]

export function FeatureStrip() {
  return (
    <section className="reveal mt-28">
      <div className="mb-5 flex items-center gap-4">
        <span className="font-mono text-xs font-medium tracking-[0.25em] text-accent">04 · AND MORE</span>
        <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Also in the box</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted">
        The same one-hook ergonomics cover the rest of the surface area. A taste of each:
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col rounded-xl border border-line bg-surface/50 p-4 backdrop-blur-sm transition-colors hover:border-accent/40"
          >
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-accent/70" />
              <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
            </div>
            <p className="mt-1 text-xs text-muted">{f.blurb}</p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-line/70 bg-[#0b0b0f] p-3">
              <CodeBlock code={f.code} className="text-[12px]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

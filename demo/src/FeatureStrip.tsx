const FEATURES = [
  'Row grouping & aggregation',
  'Column pinning',
  'Expandable sub-rows',
  'URL state sync',
  'localStorage persistence',
  'ARIA + keyboard nav',
  'TanStack Query integration',
  'Infinite scroll',
  'Devtools panel',
]

export function FeatureStrip() {
  return (
    <section className="mt-20 border-t border-line pt-10">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Also included</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {FEATURES.map((f) => (
          <li key={f} className="rounded-full border border-line px-3 py-1 text-sm text-muted">
            {f}
          </li>
        ))}
      </ul>
    </section>
  )
}

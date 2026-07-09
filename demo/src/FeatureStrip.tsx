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
    <section className="reveal mt-28">
      <div className="mb-5 flex items-center gap-4">
        <span className="font-mono text-xs font-medium tracking-[0.25em] text-accent">04 · AND MORE</span>
        <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Also in the box</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted">
        Everything above is a fraction of the surface area. The same one-hook ergonomics cover:
      </p>
      <ul className="mt-8 flex flex-wrap gap-2.5">
        {FEATURES.map((f) => (
          <li
            key={f}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface/60 px-3.5 py-2 text-sm text-muted backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-ink"
          >
            <span className="size-1.5 rounded-full bg-accent/70" />
            {f}
          </li>
        ))}
      </ul>
    </section>
  )
}

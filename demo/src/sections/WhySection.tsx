import { Section } from '../ui/Section'

type Mark = 'yes' | 'no' | 'free' | 'paid' | string

const COLS = ['TanStack Table', 'AG Grid', 'Material RT', 'tablecraft']

const ROWS: [string, Mark, Mark, Mark, Mark][] = [
  ['Headless — no CSS', 'yes', 'no', 'no', 'yes'],
  ['Zero boilerplate', 'no', 'yes', 'yes', 'yes'],
  ['TypeScript-first', 'yes', 'yes', 'yes', 'yes'],
  ['State persistence', 'no', 'paid', 'no', 'free'],
  ['Inline editing', 'no', 'paid', 'no', 'free'],
  ['Bundle size', '~15 KB', '~300 KB', '~50 KB', '~21 KB'],
  ['License', 'MIT', 'MIT*', 'MIT', 'MIT'],
]

function mark(v: Mark) {
  if (v === 'yes') return <span className="text-emerald-400">✓</span>
  if (v === 'no') return <span className="text-faint">✕</span>
  if (v === 'free') return <span className="font-medium text-emerald-400">Free</span>
  if (v === 'paid') return <span className="text-amber-400">Enterprise $$</span>
  return <span className="text-muted">{v}</span>
}

export function WhySection() {
  return (
    <Section
      index="00 · WHY"
      title="Why tablecraft?"
      description="TanStack Table is intentionally 100% headless — that's its strength, and its tax."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <div className="space-y-4 leading-relaxed text-muted">
          <p>
            Every project that reaches for <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[13px] text-ink">@tanstack/react-table</code> starts
            with the same 80–150 lines of plumbing: <span className="text-ink">useState</span> for sorting,
            pagination, and filters, <span className="text-ink">useMemo</span> for columns, and manual
            row-model wiring — rewritten table after table, app after app.
          </p>
          <p>
            <span className="text-ink">tablecraft</span> ships that plumbing as sensible defaults you opt
            into per call, then hands back the raw TanStack <span className="font-mono text-[13px] text-ink">table</span> instance
            as a full escape hatch. No styles, no component lock-in — go from ~100 lines to ~10, and drop
            down to the metal whenever you need to.
          </p>
          <p className="border-l-2 border-accent/50 pl-4 text-ink">
            I built it because I kept re-implementing the exact same table boilerplate on every React
            project. tablecraft is that boilerplate — written once, headless, tested, and MIT.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line bg-surface/70 backdrop-blur-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-elevated/40">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Feature</th>
                {COLS.map((c, i) => (
                  <th
                    key={c}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                      i === 3 ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, ...vals]) => (
                <tr key={label} className="border-b border-line/50 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{label}</td>
                  {vals.map((v, i) => (
                    <td
                      key={i}
                      className={`whitespace-nowrap px-4 py-2.5 ${i === 3 ? 'bg-accent/[0.06]' : ''}`}
                    >
                      {mark(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 font-mono text-xs text-faint">* AG Grid Community is MIT; persistence and editing are paid Enterprise features.</p>
    </Section>
  )
}

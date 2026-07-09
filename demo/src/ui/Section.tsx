import type { ReactNode } from 'react'

export function Section({
  index,
  title,
  description,
  children,
}: {
  index: string
  title: string
  description: ReactNode
  children: ReactNode
}) {
  return (
    <section className="reveal mt-28 scroll-mt-24 first:mt-24">
      <div className="mb-5 flex items-center gap-4">
        <span className="font-mono text-xs font-medium tracking-[0.25em] text-accent">{index}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </section>
  )
}

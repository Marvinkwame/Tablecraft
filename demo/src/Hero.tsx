import { useState } from 'react'
import { buttonClasses } from './ui/Button'

const INSTALL = 'npm i @marvinackerman/tablecraft @tanstack/react-table'

export function Hero() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard
      .writeText(INSTALL)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  return (
    <header className="relative pb-4 pt-14 sm:pt-20">
      {/* concentrated glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-accent/20 blur-[100px]"
      />

      <div className="relative">
        <p
          className="reveal inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-xs text-muted backdrop-blur-sm"
          style={{ animationDelay: '40ms' }}
        >
          <span className="size-1.5 rounded-full bg-emerald-400" />
          @marvinackerman/tablecraft
          <span className="text-faint">v2.5.0</span>
        </p>

        <h1
          className="reveal mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl"
          style={{ animationDelay: '110ms' }}
        >
          Batteries-included <span className="text-gradient">TanStack Table</span> for React.
        </h1>

        <p
          className="reveal mt-6 max-w-2xl text-lg leading-relaxed text-muted"
          style={{ animationDelay: '180ms' }}
        >
          Go from ~100 lines of TanStack Table boilerplate to ~10. TypeScript-first, headless, and
          zero UI lock-in — with a full escape hatch to the raw table instance whenever you need it.
        </p>

        <div
          className="reveal mt-8 flex flex-wrap items-center gap-3"
          style={{ animationDelay: '250ms' }}
        >
          <button
            onClick={copy}
            className="group flex items-center gap-3 rounded-lg border border-line bg-surface/60 py-2.5 pl-4 pr-3 font-mono text-sm backdrop-blur-sm transition-colors hover:border-accent/50"
          >
            <span className="text-accent">$</span>
            <span className="text-ink">{INSTALL}</span>
            <span
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                copied ? 'text-emerald-400' : 'text-faint group-hover:text-accent'
              }`}
            >
              {copied ? '✓ copied' : 'copy'}
            </span>
          </button>

          <a
            className={buttonClasses('ghost')}
            href="https://github.com/Marvinkwame/Tablecraft"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className={buttonClasses('ghost')}
            href="https://www.npmjs.com/package/@marvinackerman/tablecraft"
            target="_blank"
            rel="noreferrer"
          >
            npm ↗
          </a>
        </div>

        <dl
          className="reveal mt-12 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3"
          style={{ animationDelay: '320ms' }}
        >
          {[
            ['~4 KB', 'core, min+gzip'],
            ['0', 'CSS dependencies'],
            ['100%', 'TypeScript'],
          ].map(([stat, label]) => (
            <div key={label} className="bg-surface/70 px-5 py-4 backdrop-blur-sm">
              <dt className="font-display text-2xl font-semibold tracking-tight text-ink">{stat}</dt>
              <dd className="mt-0.5 font-mono text-xs text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  )
}

import { useState } from 'react'
import { Button } from './ui/Button'

const INSTALL = 'npm i @marvinackerman/tablecraft @tanstack/react-table'

export function Hero() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(INSTALL)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <header className="border-b border-line pb-12">
      <p className="font-mono text-sm text-accent">@marvinackerman/tablecraft</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        Batteries-included TanStack Table for React.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Go from ~100 lines of TanStack Table boilerplate to ~10. TypeScript-first, headless,
        zero UI lock-in — with a full escape hatch to the raw table instance.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm hover:border-accent"
        >
          <span className="text-muted">$</span> {INSTALL}
          <span className="text-accent">{copied ? '✓ copied' : '⧉'}</span>
        </button>
        <a href="https://github.com/Marvinkwame/Tablecraft" target="_blank" rel="noreferrer">
          <Button>GitHub</Button>
        </a>
        <a href="https://www.npmjs.com/package/@marvinackerman/tablecraft" target="_blank" rel="noreferrer">
          <Button>npm</Button>
        </a>
      </div>
    </header>
  )
}

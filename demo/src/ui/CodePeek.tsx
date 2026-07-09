import { useState } from 'react'
import { CodeBlock } from './CodeBlock'

export function CodePeek({ code, filename = 'example.tsx' }: { code: string; filename?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group inline-flex items-center gap-2 font-mono text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        <svg
          viewBox="0 0 12 12"
          className={`size-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 2.5 8 6l-4 3.5" />
        </svg>
        {open ? 'Hide code' : 'Show code'}
        <span className="text-faint transition-colors group-hover:text-accent">— {filename}</span>
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-xl border border-line bg-[#0b0b0f]">
          <div className="flex items-center gap-2 border-b border-line/70 bg-surface/40 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 font-mono text-xs text-muted">{filename}</span>
          </div>
          <div className="p-4">
            <CodeBlock code={code} lineNumbers />
          </div>
        </div>
      )}
    </div>
  )
}

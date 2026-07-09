import type { ReactNode } from 'react'

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/70 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_20px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

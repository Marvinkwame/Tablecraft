import type { EmployeeStatus } from '../types'

const MAP: Record<EmployeeStatus, { ring: string; dot: string; text: string }> = {
  active: { ring: 'border-emerald-400/25 bg-emerald-400/10', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  invited: { ring: 'border-amber-400/25 bg-amber-400/10', dot: 'bg-amber-400', text: 'text-amber-300' },
  suspended: { ring: 'border-rose-400/25 bg-rose-400/10', dot: 'bg-rose-400', text: 'text-rose-300' },
}

export function Badge({ status }: { status: EmployeeStatus }) {
  const s = MAP[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${s.ring} ${s.text}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

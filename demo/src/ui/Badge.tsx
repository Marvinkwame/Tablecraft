import type { EmployeeStatus } from '../types'

const MAP: Record<EmployeeStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-300',
  invited: 'bg-amber-500/15 text-amber-300',
  suspended: 'bg-rose-500/15 text-rose-300',
}

export function Badge({ status }: { status: EmployeeStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${MAP[status]}`}>
      {status}
    </span>
  )
}

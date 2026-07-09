import { createColumns } from '@marvinackerman/tablecraft'
import type { Employee } from './types'
import { Badge } from './ui/Badge'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
}

export const employeeColumns = createColumns<Employee>([
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => {
      const name = getValue<string>()
      return (
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-cyan/20 text-[11px] font-semibold text-ink ring-1 ring-line">
            {initials(name)}
          </span>
          <span className="font-medium text-ink">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }) => <span className="font-mono text-[13px] text-muted">{getValue<string>()}</span>,
  },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ getValue }) => <span className="text-muted">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    cell: ({ getValue }) => <span className="font-mono tabular-nums text-ink">{usd.format(getValue<number>())}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <Badge status={getValue<Employee['status']>()} />,
  },
  {
    accessorKey: 'lastActive',
    header: 'Last active',
    cell: ({ getValue }) => <span className="font-mono text-[13px] text-muted">{getValue<string>()}</span>,
  },
])

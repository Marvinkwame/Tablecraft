import { createColumns } from '@marvinackerman/tablecraft'
import type { Employee } from './types'
import { Badge } from './ui/Badge'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const employeeColumns = createColumns<Employee>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'department', header: 'Department' },
  {
    accessorKey: 'salary',
    header: 'Salary',
    cell: ({ getValue }) => usd.format(getValue<number>()),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <Badge status={getValue<Employee['status']>()} />,
  },
  { accessorKey: 'lastActive', header: 'Last active' },
])

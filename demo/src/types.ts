export type EmployeeStatus = 'active' | 'invited' | 'suspended'

export interface Employee {
  id: number
  name: string
  email: string
  role: string
  department: string
  salary: number
  status: EmployeeStatus
  lastActive: string // ISO date
}

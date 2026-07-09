import type { Employee, EmployeeStatus } from '../types'

// Mulberry32 — tiny deterministic PRNG so demos are stable across reloads.
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Ava', 'Liam', 'Noah', 'Emma', 'Kofi', 'Amara', 'Wei', 'Sofia', 'Omar', 'Yuki', 'Ivan', 'Lena', 'Diego', 'Priya', 'Sean', 'Nadia']
const LAST = ['Okafor', 'Chen', 'Patel', 'Silva', 'Nguyen', 'Kim', 'Rossi', 'Haddad', 'Mensah', 'Novak', 'Torres', 'Abebe', 'Larsen', 'Reyes', 'Costa', 'Fischer']
const ROLES = ['Engineer', 'Designer', 'Product Manager', 'Analyst', 'Support Lead', 'Recruiter']
const DEPTS = ['Engineering', 'Design', 'Product', 'Data', 'Support', 'People']
const STATUSES: EmployeeStatus[] = ['active', 'active', 'active', 'invited', 'suspended']

export function generateEmployees(count: number): Employee[] {
  const rng = makeRng(1337)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]
  const rows: Employee[] = []
  for (let i = 1; i <= count; i++) {
    const first = pick(FIRST)
    const last = pick(LAST)
    const daysAgo = Math.floor(rng() * 365)
    const lastActive = new Date(Date.UTC(2026, 6, 9) - daysAgo * 86_400_000)
    rows.push({
      id: i,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      role: pick(ROLES),
      department: pick(DEPTS),
      salary: 60_000 + Math.floor(rng() * 140) * 1000,
      status: pick(STATUSES),
      lastActive: lastActive.toISOString().slice(0, 10),
    })
  }
  return rows
}

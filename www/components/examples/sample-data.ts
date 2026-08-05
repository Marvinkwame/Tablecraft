export type User = {
  id: number
  name: string
  email: string
  role: string
  age: number
}

export const sampleUsers: User[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', age: 36 },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', role: 'Engineer', age: 41 },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com', role: 'Engineer', age: 45 },
  { id: 4, name: 'Katherine Johnson', email: 'katherine@example.com', role: 'Analyst', age: 39 },
  { id: 5, name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'Admin', age: 52 },
]

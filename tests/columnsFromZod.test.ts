import { describe, it, expect } from 'vitest'
import { z as z4 } from 'zod'
import { z as z3 } from 'zod-v3'
import { columnsFromZod } from '../zod/columnsFromZod'

// The same assertions run against both Zod majors. This is what substantiates
// the cross-version claim rather than assuming it.
const versions: [string, any][] = [
  ['zod4', z4],
  ['zod3', z3],
]

describe.each(versions)('columnsFromZod (%s)', (_label, z) => {
  const userSchema = z.object({
    firstName: z.string(),
    email: z.string(),
    created_at: z.string(),
    age: z.number(),
  })

  it('generates one column per shape key, in declaration order', () => {
    const cols = columnsFromZod(userSchema) as any[]
    expect(cols.map((c) => c.accessorKey)).toEqual(['firstName', 'email', 'created_at', 'age'])
  })

  it('humanizes headers', () => {
    const cols = columnsFromZod(userSchema) as any[]
    expect(cols.map((c) => c.header)).toEqual(['First Name', 'Email', 'Created At', 'Age'])
  })

  it('works with zero rows of data (schema is the only input)', () => {
    expect(columnsFromZod(userSchema).length).toBe(4)
  })

  it('honours exclude', () => {
    const cols = columnsFromZod(userSchema, { exclude: ['created_at'] }) as any[]
    expect(cols.map((c) => c.accessorKey)).toEqual(['firstName', 'email', 'age'])
  })

  it('honours include, preserving the given order', () => {
    const cols = columnsFromZod(userSchema, { include: ['age', 'email'] }) as any[]
    expect(cols.map((c) => c.accessorKey)).toEqual(['age', 'email'])
  })

  it('ignores include keys that are not in the shape', () => {
    const cols = columnsFromZod(userSchema, { include: ['email', 'nope' as any] }) as any[]
    expect(cols.map((c) => c.accessorKey)).toEqual(['email'])
  })

  it('applies overrides and lets them replace the header', () => {
    const cols = columnsFromZod(userSchema, {
      overrides: { email: { header: 'E-mail', enableSorting: false } },
    }) as any[]
    const email = cols.find((c) => c.accessorKey === 'email')
    expect(email.header).toBe('E-mail')
    expect(email.enableSorting).toBe(false)
  })

  it('skips nested object fields (depth-1 only)', () => {
    const nested = z.object({ id: z.string(), address: z.object({ city: z.string() }) })
    const cols = columnsFromZod(nested) as any[]
    expect(cols.map((c) => c.accessorKey)).toEqual(['id'])
  })

  it('throws an actionable error for a non-object schema', () => {
    expect(() => columnsFromZod(z.string() as any)).toThrow(/requires a Zod object schema/)
  })

  it('does not auto-skip arrays or wrapped objects (documented limitation)', () => {
    const schema = z.object({
      id: z.string(),
      tags: z.array(z.string()),
      address: z.object({ city: z.string() }).optional(),
      nested: z.object({ city: z.string() }),
    })
    const cols = columnsFromZod(schema) as any[]
    // `nested` is skipped (exposes .shape); `tags` and `address` are not detected.
    expect(cols.map((c) => c.accessorKey)).toEqual(['id', 'tags', 'address'])
  })
})

// Wrapped-schema behaviour is genuinely version-dependent and cannot be made
// uniform without reading Zod internals (which is forbidden):
//   Zod 3's .refine() returns ZodEffects, which hides `.shape` → no keys → throw.
//   Zod 4's .refine() keeps `.shape` → the keys are readable → it simply works.
describe('columnsFromZod — wrapped (.refine) schemas, per Zod major', () => {
  it('zod3: throws an actionable error naming the fix', () => {
    const refined = z3.object({ a: z3.string() }).refine(() => true, { message: 'nope' })
    expect(() => columnsFromZod(refined as any)).toThrow(/innerType|base object schema/)
  })

  it('zod4: generates columns normally, because .shape survives .refine()', () => {
    const refined = z4
      .object({ a: z4.string(), b: z4.number() })
      .refine(() => true, { message: 'nope' })
    const cols = columnsFromZod(refined as any) as any[]
    expect(cols.map((c) => c.accessorKey)).toEqual(['a', 'b'])
  })
})

import { describe, it, expect } from 'vitest'
import { z as z4 } from 'zod'
import { z as z3 } from 'zod-v3'
import { zodValidator } from '../zod/zodValidator'

const versions: [string, any][] = [
  ['zod4', z4],
  ['zod3', z3],
]

describe.each(versions)('zodValidator (%s)', (_label, z) => {
  const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
  })

  it('returns undefined for a valid row', () => {
    const validate = zodValidator(userSchema)
    expect(validate({ name: 'Ada', email: 'ada@example.com' })).toBeUndefined()
  })

  it('maps a field error to that field', () => {
    const validate = zodValidator(userSchema)
    expect(validate({ name: '', email: 'ada@example.com' })).toEqual({ name: 'Name is required' })
  })

  it('maps multiple field errors', () => {
    const validate = zodValidator(userSchema)
    expect(validate({ name: '', email: 'nope' })).toEqual({
      name: 'Name is required',
      email: 'Invalid email',
    })
  })

  it('keeps only the first message per field', () => {
    const schema = z.object({ name: z.string().min(2, 'Too short').max(3, 'Too long') })
    const validate = zodValidator(schema)
    const errors = validate({ name: 'a' }) as Record<string, string>
    expect(errors.name).toBe('Too short')
    expect(Object.keys(errors)).toEqual(['name'])
  })

  // ─── The critical guarantee ────────────────────────────────────────────
  // An object-level .refine() issue has an EMPTY path. If it were dropped,
  // the map would be empty, the caller's `Object.keys(e).length ? e : undefined`
  // idiom would yield undefined, and the editing hook would COMMIT AN INVALID ROW.
  it('never returns undefined when an object-level refinement fails', () => {
    const schema = z
      .object({ start: z.number(), end: z.number() })
      .refine((d: any) => d.end > d.start, { message: 'End must be after start' })
    const validate = zodValidator(schema)
    const errors = validate({ start: 10, end: 5 })
    expect(errors).toBeDefined()
    expect(Object.keys(errors as object).length).toBeGreaterThan(0)
  })

  it('attaches object-level errors to the first shape key by default', () => {
    const schema = z
      .object({ start: z.number(), end: z.number() })
      .refine((d: any) => d.end > d.start, { message: 'End must be after start' })
    const validate = zodValidator(schema)
    expect(validate({ start: 10, end: 5 })).toEqual({ start: 'End must be after start' })
  })

  it('honours rootErrorField for object-level errors', () => {
    const schema = z
      .object({ start: z.number(), end: z.number() })
      .refine((d: any) => d.end > d.start, { message: 'End must be after start' })
    const validate = zodValidator(schema, { rootErrorField: 'end' as any })
    expect(validate({ start: 10, end: 5 })).toEqual({ end: 'End must be after start' })
  })

  it('falls back to a key of the validated object when the schema exposes no shape', () => {
    // A wrapped schema has no `.shape`, so the fallback must come from the value.
    const schema = z
      .object({ start: z.number(), end: z.number() })
      .refine((d: any) => d.end > d.start, { message: 'End must be after start' })
    const validate = zodValidator(schema)
    const errors = validate({ start: 10, end: 5 }) as Record<string, string>
    expect(Object.values(errors)).toContain('End must be after start')
  })

  it('accepts wrapped (.refine) schemas — unlike columnsFromZod', () => {
    const schema = z.object({ n: z.number() }).refine((d: any) => d.n > 0, { message: 'Must be positive' })
    const validate = zodValidator(schema)
    expect(validate({ n: 5 })).toBeUndefined()
    expect(validate({ n: -1 })).toBeDefined()
  })

  it('throws rather than returning undefined when no field can be resolved', () => {
    const schema = z.object({}).refine(() => false, { message: 'Always fails' })
    const validate = zodValidator(schema)
    expect(() => validate({})).toThrow(/rootErrorField/)
  })
})

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

  it('keeps only the first message per field when one field has multiple failures', () => {
    // min() and email() BOTH fail on 'a', producing two issues on the same path.
    // (min+max can never both fail, which made the previous version tautological.)
    const schema = z.object({ name: z.string().min(5, 'Too short').email('Invalid email') })
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
    // NOTE: on Zod 3 the refine strips .shape so this resolves via the value-key
    // step; on Zod 4 .shape survives and it resolves via the shape-key step. Both
    // yield the same field here. The zod4-only test below disambiguates the order.
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
    // z.any() has no `.shape` on EITHER major, so this genuinely exercises the
    // value-key step. (A .refine()-wrapped object would still expose .shape on
    // Zod 4 and would quietly take the shape-key step instead.)
    const schema = z.any().refine((d: any) => d && d.end > d.start, {
      message: 'End must be after start',
    })
    const validate = zodValidator(schema)
    const errors = validate({ start: 10, end: 5 }) as Record<string, string>
    expect(errors).toEqual({ start: 'End must be after start' })
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

  it('treats a numeric path[0] (array index) as object-level, not a field key', () => {
    // Verified empirically: a top-level `z.array(...)` schema produces an issue
    // whose path[0] is a number (the failing item's index), on both Zod majors.
    const arraySchema = z.array(z.string())
    const validate = zodValidator(arraySchema as any)
    const errors = validate(['ok', 123]) as Record<string, string>
    // If the numeric index were used directly as a field key it would show up
    // as '1' (the failing item's index). Instead the numeric path is treated
    // as object-level and falls through to the root-field cascade, which
    // resolves to '0' — the first key of the validated array value.
    expect(Object.keys(errors)).toEqual(['0'])
  })
})

// Only Zod 4 can produce an object-level issue on a schema that still exposes
// `.shape` (Zod 3's .refine() strips it), so the shape-key-beats-value-key
// ordering is only observable on Zod 4.
describe('zodValidator — cascade order, zod4 only', () => {
  it('prefers the schema shape key over a key of the validated object', () => {
    const schema = z4
      .object({ alpha: z4.number(), beta: z4.number() })
      .refine(() => false, { message: 'Object rule failed' })
    const validate = zodValidator(schema)
    // shape's first key is `alpha`; the value's first key is `beta`.
    const errors = validate({ beta: 1, alpha: 2 }) as Record<string, string>
    expect(errors).toEqual({ alpha: 'Object rule failed' })
  })
})

/**
 * Minimal structural helpers for reading Zod schemas.
 *
 * Only PUBLIC Zod API is used here — `.shape`, `.safeParse()` and
 * `ZodError.issues` — all of which behave identically in Zod 3 and Zod 4.
 * Never read `_def` / `_zod` / `.def`: those differ between majors.
 * Never read `ZodError.errors`: it was removed in Zod 4.
 */

/** One validation issue, structurally typed so no Zod major is pinned. */
export interface ZodIssueLike {
  path: (string | number)[]
  message: string
}

/** Return a Zod object schema's `.shape`, or null when it has none. */
export function getShape(schema: unknown): Record<string, unknown> | null {
  const shape = (schema as { shape?: unknown } | null | undefined)?.shape
  if (shape && typeof shape === 'object') return shape as Record<string, unknown>
  return null
}

/** Like getShape, but throws an actionable error when the schema has no shape. */
export function requireShape(schema: unknown, fnName: string): Record<string, unknown> {
  const shape = getShape(schema)
  if (shape) return shape
  throw new Error(
    `${fnName}() requires a Zod object schema, e.g. z.object({ ... }).\n` +
      `The schema you passed exposes no \`.shape\`. This happens with wrapped schemas ` +
      `such as z.object({...}).refine(...) or .superRefine(...), and with non-object ` +
      `schemas like z.string() or z.array(...).\n` +
      `Fix: pass the base object schema (keep a reference to it before calling .refine(), ` +
      `or use schema.innerType()).\n` +
      `Note: zodValidator() accepts wrapped schemas — this restriction applies to ${fnName}() only.`
  )
}

/** Run safeParse and normalise the result across Zod majors. */
export function safeParseWith(
  schema: unknown,
  values: unknown
): { success: boolean; issues: ZodIssueLike[] } {
  const parser = schema as { safeParse?: (v: unknown) => unknown }
  if (typeof parser?.safeParse !== 'function') {
    throw new Error('zodValidator() requires a Zod schema with a .safeParse() method.')
  }
  const result = parser.safeParse(values) as {
    success: boolean
    error?: { issues?: ZodIssueLike[] }
  }
  if (result.success) return { success: true, issues: [] }
  // `.issues` exists in Zod 3 and Zod 4. `.errors` was removed in Zod 4.
  return { success: false, issues: result.error?.issues ?? [] }
}

import type { z } from 'zod'
import { getShape, safeParseWith } from './introspect'

export interface ZodValidatorOptions<TData> {
  /**
   * Field that receives object-level (empty-path) issues, e.g. from `.refine()`.
   * Default: first key of the schema's shape, else a key of the validated object.
   */
  rootErrorField?: keyof TData
}

/**
 * Build a validator that adapts a Zod schema to the error-map shape the
 * editing hooks expect: `Partial<Record<keyof TData, string>> | undefined`.
 *
 * Pass the result straight into `onSave`:
 *   onSave: async (rowId, draft) => validate(draft) ?? api.save(rowId, draft)
 *
 * Accepts wrapped schemas (`.refine()` / `.superRefine()`) — cross-field rules
 * run and are surfaced via `rootErrorField`.
 *
 * GUARANTEE: when the schema rejects the value, the returned map is never
 * empty. An empty map would collapse to `undefined` in the caller's
 * `Object.keys(e).length ? e : undefined` idiom, and the row would be
 * committed despite being invalid.
 */
export function zodValidator<TSchema extends z.ZodType>(
  schema: TSchema,
  options: ZodValidatorOptions<z.infer<TSchema>> = {}
): (values: unknown) => Partial<Record<keyof z.infer<TSchema>, string>> | undefined {
  type TData = z.infer<TSchema>
  type Errors = Partial<Record<keyof TData, string>>

  return (values: unknown): Errors | undefined => {
    const { success, issues } = safeParseWith(schema, values)
    if (success) return undefined

    const errors: Errors = {}
    const rootMessages: string[] = []

    for (const issue of issues) {
      const first = issue.path?.[0]
      // Only string paths map to a field. A numeric path[0] is an array index,
      // which cannot address a row field — treat it as object-level.
      if (typeof first === 'string') {
        const key = first as keyof TData
        if (errors[key] === undefined) errors[key] = issue.message
      } else {
        rootMessages.push(issue.message)
      }
    }

    if (rootMessages.length > 0) {
      const field = resolveRootField<TData>(options.rootErrorField, schema, values, errors)
      if (field !== undefined && errors[field] === undefined) {
        errors[field] = rootMessages[0]
      }
    }

    if (Object.keys(errors).length === 0) {
      throw new Error(
        'zodValidator: the schema rejected this value, but no field could be found to ' +
          'attach the error to, so returning a result would silently commit invalid data. ' +
          'Pass a field explicitly: zodValidator(schema, { rootErrorField: "someField" }).'
      )
    }

    return errors
  }
}

/** rootErrorField → first shape key → first key of the value → first already-errored field. */
function resolveRootField<TData>(
  configured: keyof TData | undefined,
  schema: unknown,
  values: unknown,
  errors: Partial<Record<keyof TData, string>>
): keyof TData | undefined {
  if (configured !== undefined) return configured

  const shape = getShape(schema)
  const shapeKey = shape ? Object.keys(shape)[0] : undefined
  if (shapeKey) return shapeKey as keyof TData

  if (values && typeof values === 'object') {
    const valueKey = Object.keys(values as Record<string, unknown>)[0]
    if (valueKey) return valueKey as keyof TData
  }

  const erroredKey = Object.keys(errors)[0]
  return erroredKey ? (erroredKey as keyof TData) : undefined
}

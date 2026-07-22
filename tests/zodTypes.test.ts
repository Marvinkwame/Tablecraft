import { describe, it, expectTypeOf } from 'vitest'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { columnsFromZod } from '../zod/columnsFromZod'
import { zodValidator } from '../zod/zodValidator'

const userSchema = z.object({ name: z.string(), age: z.number() })
type User = z.infer<typeof userSchema>

describe('zod entry — public generics', () => {
  it('columnsFromZod infers ColumnDef<User>[] from the schema', () => {
    const cols = columnsFromZod(userSchema)
    expectTypeOf(cols).toMatchTypeOf<ColumnDef<User, any>[]>()
  })

  it('zodValidator infers an error map keyed by the schema fields', () => {
    const validate = zodValidator(userSchema)
    const errors = validate({})
    expectTypeOf(errors).toMatchTypeOf<Partial<Record<keyof User, string>> | undefined>()
  })

  it('rootErrorField is constrained to the schema fields', () => {
    expectTypeOf(zodValidator<typeof userSchema>).toBeCallableWith(userSchema, { rootErrorField: 'name' })
  })
})

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { z } from 'zod'
import { useTable } from '../src/hooks/useTable'
import { useMultiRowEditing } from '../src/hooks/useMultiRowEditing'
import { columnsFromZod } from '../zod/columnsFromZod'
import { zodValidator } from '../zod/zodValidator'

const base = z.object({
  name: z.string().min(1, 'Name is required'),
  start: z.number(),
  end: z.number(),
})
const schema = base.refine((d) => d.end > d.start, { message: 'End must be after start' })

type Row = z.infer<typeof base>
const data: Row[] = [{ name: 'Ada', start: 1, end: 2 }]

function useSetup() {
  const table = useTable<Row>({ data, columns: columnsFromZod(base), pagination: false }).table
  const editing = useMultiRowEditing(table, {
    onSave: async (_rowId, draft) => zodValidator(schema)(draft),
  })
  return { table, editing }
}

describe('zodValidator + useMultiRowEditing', () => {
  it('keeps a row in edit mode when a field rule fails', async () => {
    const { result } = renderHook(() => useSetup())
    act(() => result.current.editing.startEditing('0'))
    act(() => result.current.editing.setField('0', 'name', ''))
    await act(async () => {
      await result.current.editing.saveRow('0')
    })
    expect(result.current.editing.isEditing('0')).toBe(true)
    expect(result.current.editing.getErrors('0').name).toBe('Name is required')
  })

  // The regression this whole design exists to prevent.
  it('keeps a row in edit mode when only an OBJECT-LEVEL rule fails', async () => {
    const { result } = renderHook(() => useSetup())
    act(() => result.current.editing.startEditing('0'))
    act(() => result.current.editing.setField('0', 'end', 0)) // end < start
    await act(async () => {
      await result.current.editing.saveRow('0')
    })
    expect(result.current.editing.isEditing('0')).toBe(true)
    const errors = result.current.editing.getErrors('0') as Record<string, string>
    expect(Object.values(errors)).toContain('End must be after start')
  })

  it('commits a row when the whole schema passes', async () => {
    const { result } = renderHook(() => useSetup())
    act(() => result.current.editing.startEditing('0'))
    act(() => result.current.editing.setField('0', 'name', 'Grace'))
    await act(async () => {
      await result.current.editing.saveRow('0')
    })
    expect(result.current.editing.isEditing('0')).toBe(false)
  })
})

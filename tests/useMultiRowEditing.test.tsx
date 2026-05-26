import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { useMultiRowEditing } from '../src/hooks/useMultiRowEditing'
import { createColumns } from '../src/helpers/createColumns'
import type { MultiRowEditingOptions } from '../src'

// ─── Test data ────────────────────────────────────────────

type User = { id: number; name: string; role: string }

const users: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  role: i % 2 === 0 ? 'Admin' : 'Member',
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
])

// TanStack Table assigns row IDs as string indices ("0", "1", "2"...)
// when no getRowId is provided — safe to use directly in mocks.

function renderMultiEditHook(options: MultiRowEditingOptions<User> = {}) {
  return renderHook(() => {
    const { table } = useTable({ data: users, columns })
    const editing = useMultiRowEditing(table, options)
    return { table, editing }
  })
}

// ─── startEditing ─────────────────────────────────────────

describe('useMultiRowEditing — startEditing', () => {
  it('adds row to editingRowIds and isEditing returns true', () => {
    const { result } = renderMultiEditHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editing.startEditing(row.id))

    expect(result.current.editing.editingRowIds).toContain(row.id)
    expect(result.current.editing.isEditing(row.id)).toBe(true)
    expect(result.current.editing.isEditing('99')).toBe(false)
  })

  it('is a no-op when called twice on the same row — draft is preserved', () => {
    const { result } = renderMultiEditHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editing.startEditing(row.id))
    act(() => result.current.editing.setField(row.id, 'name', 'Changed'))
    act(() => result.current.editing.startEditing(row.id)) // second call

    expect(result.current.editing.getDraft(row.id).name).toBe('Changed')
    expect(result.current.editing.editingRowIds).toHaveLength(1)
  })
})

// ─── setField ─────────────────────────────────────────────

describe('useMultiRowEditing — setField', () => {
  it('updates draft for the target row and does not affect other rows', () => {
    const { result } = renderMultiEditHook()
    const rows = result.current.table.getRowModel().rows

    act(() => {
      result.current.editing.startEditing(rows[0].id)
      result.current.editing.startEditing(rows[1].id)
    })
    act(() => result.current.editing.setField(rows[0].id, 'name', 'Alice'))

    expect(result.current.editing.getDraft(rows[0].id).name).toBe('Alice')
    expect(result.current.editing.getDraft(rows[1].id).name).toBe(users[1].name)
  })
})

// ─── isDirty / dirtyFields ────────────────────────────────

describe('useMultiRowEditing — isDirty / dirtyFields', () => {
  it('isDirty is true after setField changes a value; dirtyFields lists it', () => {
    const { result } = renderMultiEditHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editing.startEditing(row.id))
    expect(result.current.editing.isDirty(row.id)).toBe(false)

    act(() => result.current.editing.setField(row.id, 'name', 'Alice'))

    expect(result.current.editing.isDirty(row.id)).toBe(true)
    expect(result.current.editing.dirtyFields(row.id)).toContain('name')
    expect(result.current.editing.dirtyFields(row.id)).not.toContain('role')
  })
})

// ─── cancelRow ────────────────────────────────────────────

describe('useMultiRowEditing — cancelRow', () => {
  it('removes the row from editingRowIds and clears its draft and errors', () => {
    const { result } = renderMultiEditHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editing.startEditing(row.id))
    act(() => result.current.editing.setField(row.id, 'name', 'Alice'))
    act(() => result.current.editing.cancelRow(row.id))

    expect(result.current.editing.editingRowIds).not.toContain(row.id)
    expect(result.current.editing.isEditing(row.id)).toBe(false)
    expect(result.current.editing.getDraft(row.id)).toEqual({})
    expect(result.current.editing.getErrors(row.id)).toEqual({})
  })
})

// ─── cancelAll ────────────────────────────────────────────

describe('useMultiRowEditing — cancelAll', () => {
  it('removes all rows from edit mode and clears all drafts', () => {
    const { result } = renderMultiEditHook()
    const rows = result.current.table.getRowModel().rows

    act(() => {
      result.current.editing.startEditing(rows[0].id)
      result.current.editing.startEditing(rows[1].id)
      result.current.editing.startEditing(rows[2].id)
    })
    act(() => result.current.editing.setField(rows[0].id, 'name', 'Alice'))

    expect(result.current.editing.editingRowIds).toHaveLength(3)

    act(() => result.current.editing.cancelAll())

    expect(result.current.editing.editingRowIds).toHaveLength(0)
    expect(result.current.editing.hasUnsavedChanges).toBe(false)
  })
})

// ─── saveRow success ──────────────────────────────────────

describe('useMultiRowEditing — saveRow success', () => {
  it('calls onSave with rowId and draft, exits edit mode on success', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderMultiEditHook({ onSave })
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editing.startEditing(row.id))
    act(() => result.current.editing.setField(row.id, 'name', 'Alice'))
    await act(async () => { await result.current.editing.saveRow(row.id) })

    expect(onSave).toHaveBeenCalledWith(
      row.id,
      expect.objectContaining({ name: 'Alice' })
    )
    expect(result.current.editing.isEditing(row.id)).toBe(false)
    expect(result.current.editing.getDraft(row.id)).toEqual({})
  })
})

// ─── saveRow validation failure ───────────────────────────

describe('useMultiRowEditing — saveRow validation failure', () => {
  it('keeps row in edit mode and sets errors when onSave returns error map', async () => {
    const onSave = vi.fn().mockResolvedValue({ name: 'Name is required' })
    const { result } = renderMultiEditHook({ onSave })
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editing.startEditing(row.id))
    await act(async () => { await result.current.editing.saveRow(row.id) })

    expect(result.current.editing.isEditing(row.id)).toBe(true)
    expect(result.current.editing.getErrors(row.id)).toEqual({ name: 'Name is required' })
  })
})

// ─── saveAll without onSaveAll ────────────────────────────

describe('useMultiRowEditing — saveAll without onSaveAll', () => {
  it('calls onSave for each dirty row and exits them on success', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderMultiEditHook({ onSave })
    const rows = result.current.table.getRowModel().rows

    act(() => {
      result.current.editing.startEditing(rows[0].id)
      result.current.editing.startEditing(rows[1].id)
    })
    act(() => {
      result.current.editing.setField(rows[0].id, 'name', 'Alice')
      result.current.editing.setField(rows[1].id, 'name', 'Bob')
    })
    await act(async () => { await result.current.editing.saveAll() })

    expect(onSave).toHaveBeenCalledTimes(2)
    expect(result.current.editing.editingRowIds).toHaveLength(0)
  })
})

// ─── saveAll with onSaveAll ───────────────────────────────

describe('useMultiRowEditing — saveAll with onSaveAll', () => {
  it('calls onSaveAll once with all dirty rows', async () => {
    const onSaveAll = vi.fn().mockResolvedValue(undefined)
    const { result } = renderMultiEditHook({ onSaveAll })
    const rows = result.current.table.getRowModel().rows

    act(() => {
      result.current.editing.startEditing(rows[0].id)
      result.current.editing.startEditing(rows[1].id)
    })
    act(() => {
      result.current.editing.setField(rows[0].id, 'name', 'Alice')
      result.current.editing.setField(rows[1].id, 'name', 'Bob')
    })
    await act(async () => { await result.current.editing.saveAll() })

    expect(onSaveAll).toHaveBeenCalledTimes(1)
    expect(onSaveAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ rowId: rows[0].id }),
        expect.objectContaining({ rowId: rows[1].id }),
      ])
    )
    expect(result.current.editing.editingRowIds).toHaveLength(0)
  })
})

// ─── saveAll with onSaveAll — partial errors ──────────────

describe('useMultiRowEditing — saveAll partial errors', () => {
  it('rows with errors stay in edit mode; rows without errors exit', async () => {
    // Row IDs are "0", "1", "2"... (TanStack string index defaults)
    const onSaveAll = vi.fn().mockResolvedValue({
      '0': { name: 'Name is too long' }, // row 0 has errors — stays
      // row 1 has no errors — exits
    })
    const { result } = renderMultiEditHook({ onSaveAll })
    const rows = result.current.table.getRowModel().rows

    act(() => {
      result.current.editing.startEditing(rows[0].id)
      result.current.editing.startEditing(rows[1].id)
    })
    act(() => {
      result.current.editing.setField(rows[0].id, 'name', 'Alice')
      result.current.editing.setField(rows[1].id, 'name', 'Bob')
    })
    await act(async () => { await result.current.editing.saveAll() })

    expect(result.current.editing.isEditing(rows[0].id)).toBe(true)
    expect(result.current.editing.getErrors(rows[0].id)).toEqual({ name: 'Name is too long' })
    expect(result.current.editing.isEditing(rows[1].id)).toBe(false)
  })
})

// ─── hasUnsavedChanges ────────────────────────────────────

describe('useMultiRowEditing — hasUnsavedChanges', () => {
  it('is true when any row is dirty, false when all clean', () => {
    const { result } = renderMultiEditHook()
    const row = result.current.table.getRowModel().rows[0]

    expect(result.current.editing.hasUnsavedChanges).toBe(false)

    act(() => result.current.editing.startEditing(row.id))
    expect(result.current.editing.hasUnsavedChanges).toBe(false) // in edit mode but not changed

    act(() => result.current.editing.setField(row.id, 'name', 'Alice'))
    expect(result.current.editing.hasUnsavedChanges).toBe(true)

    act(() => result.current.editing.cancelRow(row.id))
    expect(result.current.editing.hasUnsavedChanges).toBe(false)
  })
})

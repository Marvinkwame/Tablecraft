import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { useEditableRows } from '../src/hooks/useEditableRows'
import { createColumns } from '../src/helpers/createColumns'
import type { EditableOptions } from '../src'

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

// Helper: render useTable + useEditableRows together
function renderEditableHook(onSave?: EditableOptions<User>['onSave']) {
  return renderHook(() => {
    const { table } = useTable({ data: users, columns })
    const editable = useEditableRows(table, { onSave })
    return { table, editable }
  })
}

// ─── Default state ────────────────────────────────────────

describe('useEditableRows — default state', () => {
  it('editingRowId is null, isDirty false, errors empty', () => {
    const { result } = renderEditableHook()
    expect(result.current.editable.editingRowId).toBeNull()
    expect(result.current.editable.isDirty).toBe(false)
    expect(result.current.editable.dirtyFields).toEqual([])
    expect(result.current.editable.errors).toEqual({})
    expect(result.current.editable.draftData).toEqual({})
  })
})

// ─── startEditing ─────────────────────────────────────────

describe('useEditableRows — startEditing', () => {
  it('sets editingRowId and isEditing returns true', () => {
    const { result } = renderEditableHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))

    expect(result.current.editable.editingRowId).toBe(row.id)
    expect(result.current.editable.isEditing(row.id)).toBe(true)
    expect(result.current.editable.isEditing('99')).toBe(false)
  })

  it('snapshots original data into draftData', () => {
    const { result } = renderEditableHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))

    expect(result.current.editable.draftData).toEqual(row.original)
  })

  it('starting a second row clears previous draft and errors', async () => {
    const onSave = vi.fn().mockResolvedValue({ name: 'Required' })
    const { result } = renderEditableHook(onSave)
    const rows = result.current.table.getRowModel().rows

    // Start editing row 0, save to get some errors into state
    act(() => result.current.editable.startEditing(rows[0].id))
    await act(async () => { await result.current.editable.saveEditing() })

    expect(result.current.editable.errors).toEqual({ name: 'Required' })

    // Start editing row 1 — should wipe the errors and draft from row 0
    act(() => result.current.editable.startEditing(rows[1].id))

    expect(result.current.editable.editingRowId).toBe(rows[1].id)
    expect(result.current.editable.errors).toEqual({})
    expect(result.current.editable.draftData).toEqual(rows[1].original)
  })
})

// ─── setField ─────────────────────────────────────────────

describe('useEditableRows — setField', () => {
  it('updates draftData for the changed field', () => {
    const { result } = renderEditableHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    act(() => result.current.editable.setField('name', 'Alice'))

    expect(result.current.editable.draftData.name).toBe('Alice')
  })

  it('isDirty becomes true after setField changes a value', () => {
    const { result } = renderEditableHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    expect(result.current.editable.isDirty).toBe(false)

    act(() => result.current.editable.setField('name', 'Alice'))
    expect(result.current.editable.isDirty).toBe(true)
  })

  it('dirtyFields lists only the changed field', () => {
    const { result } = renderEditableHook()
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    act(() => result.current.editable.setField('name', 'Alice'))

    expect(result.current.editable.dirtyFields).toEqual(['name'])
    expect(result.current.editable.dirtyFields).not.toContain('role')
  })
})

// ─── cancelEditing ────────────────────────────────────────

describe('useEditableRows — cancelEditing', () => {
  it('resets editingRowId, draftData, and errors to empty state', async () => {
    const onSave = vi.fn().mockResolvedValue({ name: 'Required' })
    const { result } = renderEditableHook(onSave)
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    act(() => result.current.editable.setField('name', 'Alice'))
    await act(async () => { await result.current.editable.saveEditing() })

    // Errors are now set — cancel should clear everything
    act(() => result.current.editable.cancelEditing())

    expect(result.current.editable.editingRowId).toBeNull()
    expect(result.current.editable.draftData).toEqual({})
    expect(result.current.editable.errors).toEqual({})
    expect(result.current.editable.isDirty).toBe(false)
  })
})

// ─── saveEditing ──────────────────────────────────────────

describe('useEditableRows — saveEditing', () => {
  it('exits edit mode when onSave returns void', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderEditableHook(onSave)
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    await act(async () => { await result.current.editable.saveEditing() })

    expect(result.current.editable.editingRowId).toBeNull()
    expect(result.current.editable.draftData).toEqual({})
  })

  it('stays in edit mode and sets errors when onSave returns an error map', async () => {
    const onSave = vi.fn().mockResolvedValue({ name: 'Name is required' })
    const { result } = renderEditableHook(onSave)
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    await act(async () => { await result.current.editable.saveEditing() })

    expect(result.current.editable.editingRowId).toBe(row.id)
    expect(result.current.editable.errors).toEqual({ name: 'Name is required' })
  })

  it('awaits async onSave before exiting edit mode', async () => {
    let resolved = false
    const onSave = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10))
      resolved = true
    })
    const { result } = renderEditableHook(onSave)
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    await act(async () => { await result.current.editable.saveEditing() })

    expect(resolved).toBe(true)
    expect(result.current.editable.editingRowId).toBeNull()
  })

  it('stays in edit mode when async onSave resolves with errors', async () => {
    const onSave = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10))
      return { role: 'Invalid role' }
    })
    const { result } = renderEditableHook(onSave)
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    await act(async () => { await result.current.editable.saveEditing() })

    expect(result.current.editable.editingRowId).toBe(row.id)
    expect(result.current.editable.errors).toEqual({ role: 'Invalid role' })
  })
})

// ─── isSaving ─────────────────────────────────────────────

describe('useEditableRows — isSaving', () => {
  it('is false by default', () => {
    const { result } = renderEditableHook()
    expect(result.current.editable.isSaving).toBe(false)
  })

  it('is false after saveEditing resolves', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderEditableHook(onSave)
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    await act(async () => { await result.current.editable.saveEditing() })

    expect(result.current.editable.isSaving).toBe(false)
  })

  it('is false after saveEditing resolves with errors', async () => {
    const onSave = vi.fn().mockResolvedValue({ name: 'Required' })
    const { result } = renderEditableHook(onSave)
    const row = result.current.table.getRowModel().rows[0]

    act(() => result.current.editable.startEditing(row.id))
    await act(async () => { await result.current.editable.saveEditing() })

    expect(result.current.editable.isSaving).toBe(false)
    expect(result.current.editable.errors).toEqual({ name: 'Required' })
  })
})

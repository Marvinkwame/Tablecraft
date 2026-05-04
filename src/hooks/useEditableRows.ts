'use client'

import { useState, useCallback, useMemo } from 'react'
import type { RowData, Table } from '@tanstack/react-table'
import type { EditableOptions, EditableReturn } from '../types'

export function useEditableRows<TData extends RowData>(
  table: Table<TData>,
  options: EditableOptions<TData> = {}
): EditableReturn<TData> {
  const { onSave } = options

  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [draftData, setDraftData] = useState<Partial<TData>>({})
  const [originalSnapshot, setOriginalSnapshot] = useState<Partial<TData>>({})
  const [errors, setErrors] = useState<Partial<Record<keyof TData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  // ─── startEditing ─────────────────────────────────────────
  const startEditing = useCallback((rowId: string) => {
    const original = { ...(table.getRow(rowId).original as object) } as Partial<TData>
    setEditingRowId(rowId)
    setDraftData(original)
    setOriginalSnapshot(original)
    setErrors({})
  }, [table])

  // ─── setField ─────────────────────────────────────────────
  const setField = useCallback(<K extends keyof TData>(field: K, value: TData[K]) => {
    setDraftData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // ─── cancelEditing ────────────────────────────────────────
  const cancelEditing = useCallback(() => {
    setEditingRowId(null)
    setDraftData({})
    setOriginalSnapshot({})
    setErrors({})
    setIsSaving(false)
  }, [])

  // ─── saveEditing ──────────────────────────────────────────
  const saveEditing = useCallback(async () => {
    if (!editingRowId) return

    if (!onSave) {
      cancelEditing()
      return
    }

    setIsSaving(true)
    try {
      const result = await onSave(editingRowId, draftData as TData)
      if (result && typeof result === 'object' && Object.keys(result).length > 0) {
        setErrors(result as Partial<Record<keyof TData, string>>)
      } else {
        cancelEditing()
        return
      }
    } finally {
      setIsSaving(false)
    }
  }, [editingRowId, draftData, onSave, cancelEditing])

  // ─── isEditing ────────────────────────────────────────────
  const isEditing = useCallback(
    (rowId: string) => editingRowId === rowId,
    [editingRowId]
  )

  // ─── Dirty tracking ───────────────────────────────────────
  const dirtyFields = useMemo(
    () =>
      Object.keys(draftData).filter(
        (k) =>
          draftData[k as keyof TData] !== originalSnapshot[k as keyof TData]
      ) as (keyof TData)[],
    [draftData, originalSnapshot]
  )

  const isDirty = dirtyFields.length > 0

  return {
    editingRowId,
    draftData,
    isDirty,
    dirtyFields,
    errors,
    isSaving,
    isEditing,
    startEditing,
    setField,
    saveEditing,
    cancelEditing,
  }
}

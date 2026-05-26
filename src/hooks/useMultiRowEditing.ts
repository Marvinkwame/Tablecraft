'use client'

import { useState, useCallback, useMemo } from 'react'
import type { RowData, Table } from '@tanstack/react-table'
import type { MultiRowEditingOptions, MultiRowEditingReturn } from '../types'

export function useMultiRowEditing<TData extends RowData>(
  table: Table<TData>,
  options: MultiRowEditingOptions<TData> = {}
): MultiRowEditingReturn<TData> {
  const { onSave, onSaveAll } = options

  // Internal state — plain Records (Map is not React-state-friendly)
  const [drafts, setDrafts] = useState<Record<string, Partial<TData>>>({})
  const [originals, setOriginals] = useState<Record<string, Partial<TData>>>({})
  const [errorsMap, setErrorsMap] = useState<
    Record<string, Partial<Record<keyof TData, string>>>
  >({})
  const [savingRowsSet, setSavingRowsSet] = useState<Record<string, true>>({})
  const [isSavingAll, setIsSavingAll] = useState(false)

  // ─── Derived state ────────────────────────────────────────
  const editingRowIds = useMemo(() => Object.keys(drafts), [drafts])

  const hasUnsavedChanges = useMemo(
    () =>
      Object.keys(drafts).some((rowId) => {
        const draft = drafts[rowId] ?? {}
        const orig = originals[rowId] ?? {}
        return Object.keys(draft).some(
          (k) => draft[k as keyof TData] !== orig[k as keyof TData]
        )
      }),
    [drafts, originals]
  )

  // ─── startEditing ─────────────────────────────────────────
  const startEditing = useCallback(
    (rowId: string) => {
      const original = {
        ...(table.getRow(rowId).original as object),
      } as Partial<TData>
      setDrafts((prev) => {
        if (rowId in prev) return prev
        return { ...prev, [rowId]: original }
      })
      setOriginals((prev) => {
        if (rowId in prev) return prev
        return { ...prev, [rowId]: original }
      })
    },
    [table]
  )

  // ─── setField ─────────────────────────────────────────────
  const setField = useCallback(
    <K extends keyof TData>(rowId: string, field: K, value: TData[K]) => {
      setDrafts((prev) => ({
        ...prev,
        [rowId]: { ...prev[rowId], [field]: value },
      }))
    },
    []
  )

  // ─── cancelRow ────────────────────────────────────────────
  const cancelRow = useCallback((rowId: string) => {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[rowId]
      return next
    })
    setOriginals((prev) => {
      const next = { ...prev }
      delete next[rowId]
      return next
    })
    setErrorsMap((prev) => {
      const next = { ...prev }
      delete next[rowId]
      return next
    })
  }, [])

  // ─── cancelAll ────────────────────────────────────────────
  const cancelAll = useCallback(() => {
    setDrafts({})
    setOriginals({})
    setErrorsMap({})
  }, [])

  // ─── saveRow ──────────────────────────────────────────────
  const saveRow = useCallback(
    async (rowId: string) => {
      if (!onSave) return
      if (!(rowId in drafts)) return
      setSavingRowsSet((prev) => ({ ...prev, [rowId]: true }))
      try {
        const result = await onSave(rowId, drafts[rowId] as TData)
        if (result && typeof result === 'object' && Object.keys(result).length > 0) {
          setErrorsMap((prev) => ({
            ...prev,
            [rowId]: result as Partial<Record<keyof TData, string>>,
          }))
        } else {
          setDrafts((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
          })
          setOriginals((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
          })
          setErrorsMap((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
          })
        }
      } finally {
        setSavingRowsSet((prev) => {
          const next = { ...prev }
          delete next[rowId]
          return next
        })
      }
    },
    [onSave, drafts]
  )

  // ─── saveAll ──────────────────────────────────────────────
  const saveAll = useCallback(async () => {
    const dirtyIds = Object.keys(drafts).filter((rowId) => {
      const draft = drafts[rowId] ?? {}
      const orig = originals[rowId] ?? {}
      return Object.keys(draft).some(
        (k) => draft[k as keyof TData] !== orig[k as keyof TData]
      )
    })
    if (dirtyIds.length === 0) return

    if (onSaveAll) {
      setIsSavingAll(true)
      try {
        const rows = dirtyIds.map((rowId) => ({
          rowId,
          draft: drafts[rowId] as TData,
        }))
        const result = await onSaveAll(rows)
        const errorMap = result ?? {}
        setDrafts((prev) => {
          const next = { ...prev }
          for (const rowId of dirtyIds) {
            const rowErrors = errorMap[rowId]
            if (!rowErrors || Object.keys(rowErrors).length === 0) {
              delete next[rowId]
            }
          }
          return next
        })
        setOriginals((prev) => {
          const next = { ...prev }
          for (const rowId of dirtyIds) {
            const rowErrors = errorMap[rowId]
            if (!rowErrors || Object.keys(rowErrors).length === 0) {
              delete next[rowId]
            }
          }
          return next
        })
        setErrorsMap((prev) => {
          const next = { ...prev }
          for (const rowId of dirtyIds) {
            const rowErrors = errorMap[rowId]
            if (rowErrors && Object.keys(rowErrors).length > 0) {
              next[rowId] = rowErrors as Partial<Record<keyof TData, string>>
            } else {
              delete next[rowId]
            }
          }
          return next
        })
      } finally {
        setIsSavingAll(false)
      }
    } else {
      await Promise.allSettled(dirtyIds.map((rowId) => saveRow(rowId)))
    }
  }, [drafts, originals, onSaveAll, saveRow])

  // ─── Query helpers ────────────────────────────────────────
  const isEditing = useCallback(
    (rowId: string) => rowId in drafts,
    [drafts]
  )

  const isDirty = useCallback(
    (rowId: string): boolean => {
      const draft = drafts[rowId] ?? {}
      const orig = originals[rowId] ?? {}
      return Object.keys(draft).some(
        (k) => draft[k as keyof TData] !== orig[k as keyof TData]
      )
    },
    [drafts, originals]
  )

  const dirtyFields = useCallback(
    (rowId: string): (keyof TData)[] => {
      const draft = drafts[rowId] ?? {}
      const orig = originals[rowId] ?? {}
      return Object.keys(draft).filter(
        (k) => draft[k as keyof TData] !== orig[k as keyof TData]
      ) as (keyof TData)[]
    },
    [drafts, originals]
  )

  const getDraft = useCallback(
    (rowId: string): Partial<TData> => drafts[rowId] ?? {},
    [drafts]
  )

  const getErrors = useCallback(
    (rowId: string): Partial<Record<keyof TData, string>> =>
      errorsMap[rowId] ?? {},
    [errorsMap]
  )

  const isSavingRow = useCallback(
    (rowId: string): boolean => rowId in savingRowsSet,
    [savingRowsSet]
  )

  return {
    editingRowIds,
    savingRows: Object.keys(savingRowsSet),
    isSavingAll,
    hasUnsavedChanges,
    startEditing,
    setField,
    saveRow,
    cancelRow,
    isEditing,
    isDirty,
    dirtyFields,
    getDraft,
    getErrors,
    isSavingRow,
    saveAll,
    cancelAll,
  }
}

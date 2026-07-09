import { useMemo } from 'react'
import { useTable, useMultiRowEditing, createColumns } from '@marvinackerman/tablecraft'
import { generateEmployees } from '../data/seed'
import type { Employee } from '../types'
import { TableShell } from '../ui/TableShell'
import { Toolbar } from '../ui/Toolbar'
import { Button } from '../ui/Button'
import { CodePeek } from '../ui/CodePeek'

const editColumns = createColumns<Employee>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
])

const SNIPPET = `const { startEditing, setField, getDraft, getErrors,
        saveRow, cancelRow, saveAll, cancelAll, isEditing, isDirty,
        hasUnsavedChanges, isSavingAll } = useMultiRowEditing(table, {
  onSave: async (rowId, draft) => {
    const errors: Record<string, string> = {}
    if (!draft.name?.trim()) errors.name = 'Name is required'
    if (!draft.email?.includes('@')) errors.email = 'Invalid email'
    return Object.keys(errors).length ? errors : undefined
  },
})`

export function EditingSection() {
  const data = useMemo(() => generateEmployees(8), [])
  const { table } = useTable({ data, columns: editColumns, pagination: false })

  const {
    startEditing, setField, getDraft, getErrors,
    saveRow, cancelRow, saveAll, cancelAll,
    isEditing, isDirty, hasUnsavedChanges, isSavingAll,
  } = useMultiRowEditing(table, {
    onSave: async (_rowId, draft) => {
      const errors: Partial<Record<keyof Employee, string>> = {}
      if (!draft.name?.trim()) errors.name = 'Name is required'
      if (!draft.email?.includes('@')) errors.email = 'Invalid email'
      return Object.keys(errors).length ? errors : undefined
    },
  })

  const fields: (keyof Employee)[] = ['name', 'email', 'role']

  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold">Inline editing</h2>
      <p className="mt-1 text-muted">Multi-row editing with dirty tracking, validation, and Save All — no form library.</p>

      <div className="mt-4">
        <Toolbar>
          {hasUnsavedChanges && (
            <>
              <Button variant="solid" onClick={saveAll} disabled={isSavingAll}>
                {isSavingAll ? 'Saving…' : 'Save all'}
              </Button>
              <Button onClick={cancelAll}>Cancel all</Button>
            </>
          )}
        </Toolbar>

        <TableShell>
          <thead>
            <tr className="border-b border-line">
              {['Name', 'Email', 'Role', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 font-medium text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const editing = isEditing(row.id)
              const draft = getDraft(row.id)
              const errors = getErrors(row.id)
              return (
                <tr key={row.id} className={`border-b border-line/60 ${isDirty(row.id) ? 'bg-accent/5' : ''}`}>
                  {editing ? (
                    <>
                      {fields.map((field) => (
                        <td key={field} className="px-4 py-2 align-top">
                          <input
                            className="w-full rounded-md border border-line bg-canvas px-2 py-1 text-sm outline-none focus:border-accent"
                            value={String(draft[field] ?? row.original[field] ?? '')}
                            onChange={(e) => setField(row.id, field, e.target.value)}
                          />
                          {errors[field] && <span className="mt-1 block text-xs text-rose-400">{errors[field]}</span>}
                        </td>
                      ))}
                      <td className="px-4 py-2 align-top">
                        <div className="flex gap-1.5">
                          <Button variant="solid" onClick={() => saveRow(row.id)}>Save</Button>
                          <Button onClick={() => cancelRow(row.id)}>Cancel</Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5">{row.original.name}</td>
                      <td className="px-4 py-2.5">{row.original.email}</td>
                      <td className="px-4 py-2.5">{row.original.role}</td>
                      <td className="px-4 py-2.5">
                        <Button onClick={() => startEditing(row.id)}>Edit</Button>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </TableShell>

        <CodePeek code={SNIPPET} />
      </div>
    </section>
  )
}

import { useMemo } from 'react'
import { useTable, useMultiRowEditing, createColumns } from '@marvinackerman/tablecraft'
import { generateEmployees } from '../data/seed'
import type { Employee } from '../types'
import { Section } from '../ui/Section'
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
    <Section
      index="02 · MUTATIONS"
      title="Inline editing"
      description="Multi-row editing with per-field dirty tracking, validation, and batched Save All — and not a form library in sight."
    >
      <Toolbar>
        {hasUnsavedChanges ? (
          <>
            <Button variant="solid" onClick={saveAll} disabled={isSavingAll}>
              {isSavingAll ? 'Saving…' : 'Save all'}
            </Button>
            <Button onClick={cancelAll}>Cancel all</Button>
            <span className="ml-1 flex items-center gap-1.5 font-mono text-xs text-accent-soft">
              <span className="size-1.5 rounded-full bg-accent" />
              unsaved changes
            </span>
          </>
        ) : (
          <span className="font-mono text-xs text-faint">Click Edit on any row to begin</span>
        )}
      </Toolbar>

      <TableShell>
        <thead>
          <tr className="border-b border-line bg-elevated/40">
            {['Name', 'Email', 'Role', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const editing = isEditing(row.id)
            const draft = getDraft(row.id)
            const errors = getErrors(row.id)
            const dirty = isDirty(row.id)
            return (
              <tr
                key={row.id}
                className={`border-b border-line/50 transition-colors last:border-0 ${
                  dirty ? 'bg-accent/[0.06] shadow-[inset_2px_0_0_0_var(--color-accent)]' : 'hover:bg-elevated/40'
                }`}
              >
                {editing ? (
                  <>
                    {fields.map((field) => (
                      <td key={field} className="px-4 py-2 align-top">
                        <input
                          className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-accent/60"
                          value={String(draft[field] ?? row.original[field] ?? '')}
                          onChange={(e) => setField(row.id, field, e.target.value)}
                        />
                        {errors[field] && (
                          <span className="mt-1 block text-xs text-rose-400">{errors[field]}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2 align-top">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="solid" onClick={() => saveRow(row.id)}>
                          Save
                        </Button>
                        <Button onClick={() => cancelRow(row.id)}>Cancel</Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-medium text-ink">{row.original.name}</td>
                    <td className="px-4 py-2.5 font-mono text-[13px] text-muted">{row.original.email}</td>
                    <td className="px-4 py-2.5 text-muted">{row.original.role}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Button onClick={() => startEditing(row.id)}>Edit</Button>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </TableShell>

      <CodePeek code={SNIPPET} filename="useMultiRowEditing.tsx" />
    </Section>
  )
}

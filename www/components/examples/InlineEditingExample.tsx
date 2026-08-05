'use client'
import { useState } from 'react'
import { useTable, useEditableRows, createColumns } from '@marvinackerman/tablecraft'
import { flexRender } from '@tanstack/react-table'
import { sampleUsers, type User } from './sample-data'

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'age', header: 'Age' },
])

export default function InlineEditingExample() {
  // A local copy of the shared sample data — edits here never touch the
  // original `sampleUsers` array used by other examples on this page.
  const [users, setUsers] = useState<User[]>(() => sampleUsers.map((u) => ({ ...u })))
  const { table } = useTable<User>({ data: users, columns })
  const editable = useEditableRows<User>(table, {
    onSave: (rowId, draft) => {
      setUsers((prev) => prev.map((u, i) => (String(i) === rowId ? { ...u, ...draft } : u)))
    },
  })

  return (
    <div className="not-prose overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2 text-left font-medium">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const editing = editable.isEditing(row.id)
            return (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map((cell) => {
                  const field = cell.column.id as keyof User

                  if (editing) {
                    return (
                      <td key={cell.id} className="px-3 py-2">
                        <input
                          className="w-full rounded border bg-transparent px-1.5 py-0.5"
                          value={String(editable.draftData[field] ?? '')}
                          onChange={(e) =>
                            editable.setField(
                              field,
                              (field === 'age'
                                ? Number(e.target.value)
                                : e.target.value) as User[typeof field],
                            )
                          }
                        />
                        {editable.errors[field] && (
                          <span className="mt-1 block text-xs text-red-500">
                            {editable.errors[field]}
                          </span>
                        )}
                      </td>
                    )
                  }

                  return (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
                <td className="px-3 py-2">
                  {editing ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-fd-primary px-2 py-1 text-xs text-fd-primary-foreground disabled:opacity-50"
                        onClick={editable.saveEditing}
                        disabled={editable.isSaving}
                      >
                        {editable.isSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs"
                        onClick={editable.cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => editable.startEditing(row.id)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

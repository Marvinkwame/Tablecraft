import { useMemo } from 'react'
import { useTable } from '@marvinackerman/tablecraft'
import { flexRender } from '@tanstack/react-table'
import { generateEmployees } from '../data/seed'
import { employeeColumns } from '../columns'
import { TableShell } from '../ui/TableShell'
import { Toolbar } from '../ui/Toolbar'
import { Button } from '../ui/Button'
import { CodePeek } from '../ui/CodePeek'

const SNIPPET = `const { table, pagination, sorting, globalFilter } = useTable({
  data: employees,
  columns,
  pagination: { pageSize: 10 },
  sorting: true,
  globalFilter: true,
  columnFilters: true,
})`

export function CoreSection() {
  const data = useMemo(() => generateEmployees(200), [])
  const { table, pagination, globalFilter, emptyState } = useTable({
    data,
    columns: employeeColumns,
    pagination: { pageSize: 10 },
    sorting: true,
    globalFilter: true,
    columnFilters: true,
  })

  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold">Core interactions</h2>
      <p className="mt-1 text-muted">Sorting, pagination, and global search — wired in one hook call.</p>

      <div className="mt-4">
        <Toolbar>
          <input
            className="w-64 rounded-md border border-line bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent"
            placeholder="Search employees…"
            value={globalFilter.value}
            onChange={(e) => globalFilter.setValue(e.target.value)}
          />
        </Toolbar>

        <TableShell>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-line">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none px-4 py-2.5 font-medium text-muted hover:text-ink"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {emptyState.isFilteredEmpty ? (
              <tr>
                <td colSpan={employeeColumns.length} className="px-4 py-10 text-center text-muted">
                  No employees match “{globalFilter.value}”.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-line/60 hover:bg-canvas/40">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </TableShell>

        <div className="mt-3 flex items-center gap-3 text-sm text-muted">
          <Button onClick={pagination.previousPage} disabled={!pagination.canPreviousPage}>Previous</Button>
          <span>Page {pagination.pageIndex + 1} of {pagination.pageCount}</span>
          <Button onClick={pagination.nextPage} disabled={!pagination.canNextPage}>Next</Button>
        </div>

        <CodePeek code={SNIPPET} />
      </div>
    </section>
  )
}

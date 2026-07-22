import { useMemo } from 'react'
import { useTable } from '@marvinackerman/tablecraft'
import { flexRender } from '@tanstack/react-table'
import { generateEmployees } from '../data/seed'
import { employeeColumns } from '../columns'
import { Section } from '../ui/Section'
import { TableShell } from '../ui/TableShell'
import { Toolbar } from '../ui/Toolbar'
import { Button } from '../ui/Button'
import { CodePeek } from '../ui/CodePeek'

const SNIPPET = `import { useTable } from '@marvinackerman/tablecraft'

const { table, pagination, globalFilter, emptyState } = useTable({
  data: employees,
  columns,
  pagination: { pageSize: 10 },
  sorting: true,
  globalFilter: true,
  columnFilters: true,
})`

const sortGlyph: Record<string, string> = { asc: '↑', desc: '↓' }

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
    <Section
      index="01 · DATA GRID"
      title="Core interactions"
      description="Sorting, pagination, and global search — wired up in a single hook call, no boilerplate."
    >
      <Toolbar>
        <div className="relative">
          <svg
            viewBox="0 0 16 16"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="m11 11 3 3" strokeLinecap="round" />
          </svg>
          <input
            className="w-72 rounded-lg border border-line bg-canvas/60 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            placeholder="Search employees…"
            value={globalFilter.value}
            onChange={(e) => globalFilter.setValue(e.target.value)}
          />
        </div>
        <span className="ml-auto font-mono text-xs text-faint">
          {table.getFilteredRowModel().rows.length} of {data.length} rows
        </span>
      </Toolbar>

      <TableShell>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-line bg-elevated/40">
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted() as string
                const alignRight = header.column.id === 'salary'
                return (
                  <th
                    key={header.id}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                    onClick={header.column.getToggleSortingHandler()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        header.column.getToggleSortingHandler()?.(e)
                      }
                    }}
                    className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-ink ${alignRight ? 'text-right' : ''}`}
                  >
                    <span className={`inline-flex items-center gap-1 ${alignRight ? 'flex-row-reverse' : ''}`}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className={`text-accent ${sorted ? 'opacity-100' : 'opacity-0'}`}>
                        {sortGlyph[sorted] ?? '↑'}
                      </span>
                    </span>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {emptyState.isFilteredEmpty ? (
            <tr>
              <td colSpan={employeeColumns.length} className="px-4 py-16 text-center">
                <p className="text-muted">
                  No employees match “<span className="text-ink">{globalFilter.value}</span>”.
                </p>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-line/50 transition-colors last:border-0 hover:bg-elevated/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`whitespace-nowrap px-4 py-2.5 ${cell.column.id === 'salary' ? 'text-right' : ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      <div className="mt-4 flex items-center gap-3 text-sm text-muted">
        <Button onClick={pagination.previousPage} disabled={!pagination.canPreviousPage}>
          ← Prev
        </Button>
        <span className="font-mono text-xs text-faint">
          {String(pagination.pageIndex + 1).padStart(2, '0')} / {String(pagination.pageCount).padStart(2, '0')}
        </span>
        <Button onClick={pagination.nextPage} disabled={!pagination.canNextPage}>
          Next →
        </Button>
      </div>

      <CodePeek code={SNIPPET} filename="useTable.tsx" />
    </Section>
  )
}

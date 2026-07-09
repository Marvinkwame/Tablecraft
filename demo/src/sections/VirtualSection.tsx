import { useMemo } from 'react'
import { useTable, useVirtualRows } from '@marvinackerman/tablecraft'
import { flexRender } from '@tanstack/react-table'
import { generateEmployees } from '../data/seed'
import { employeeColumns } from '../columns'
import { CodePeek } from '../ui/CodePeek'

const ROW_HEIGHT = 44
const TOTAL = 50_000

const SNIPPET = `const { virtualRows, totalHeight, containerRef } =
  useVirtualRows(table, { rowHeight: 44 })

// Only the rows in view are in the DOM:
{virtualRows.map(({ row, start, size }) => (
  <div style={{ position: 'absolute', top: start, height: size }}>
    …cells…
  </div>
))}`

export function VirtualSection() {
  const data = useMemo(() => generateEmployees(TOTAL), [])
  const { table } = useTable({ data, columns: employeeColumns, pagination: false })
  const { virtualRows, totalHeight, containerRef } = useVirtualRows(table, { rowHeight: ROW_HEIGHT })

  const headers = table.getHeaderGroups()[0].headers

  return (
    <section className="mt-16">
      <h2 className="text-xl font-semibold">Virtualization</h2>
      <p className="mt-1 text-muted">
        {TOTAL.toLocaleString()} rows, buttery scroll —{' '}
        <span className="font-mono text-accent">{virtualRows.length}</span> rendered in the DOM.
      </p>

      <div className="mt-4 rounded-lg border border-line bg-surface" role="table" aria-rowcount={TOTAL}>
        <div className="flex border-b border-line" role="row">
          {headers.map((header) => (
            <div key={header.id} role="columnheader" className="flex-1 truncate px-4 py-2.5 text-sm font-medium text-muted">
              {flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))}
        </div>

        <div ref={containerRef} style={{ height: 480, overflow: 'auto' }}>
          <div role="rowgroup" style={{ height: totalHeight, position: 'relative' }}>
            {virtualRows.map(({ row, start, size }) => (
              <div
                key={row.id}
                role="row"
                className="flex border-b border-line/60"
                style={{ position: 'absolute', top: start, height: size, width: '100%' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} role="cell" className="flex flex-1 items-center truncate px-4 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <CodePeek code={SNIPPET} />
    </section>
  )
}

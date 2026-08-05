'use client'
import { useMemo } from 'react'
import { useTable, useVirtualRows, createColumns } from '@marvinackerman/tablecraft'
import { flexRender } from '@tanstack/react-table'

type BigRow = { id: number; name: string; value: number }

function generateRows(count: number): BigRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Row ${i}`,
    value: Math.round(Math.random() * 1000),
  }))
}

const columns = createColumns<BigRow>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'value', header: 'Value' },
])

const ROW_HEIGHT = 36

export default function VirtualizationExample() {
  // Generated once — 10,000 in-memory rows, no network.
  const data = useMemo(() => generateRows(10000), [])
  // Virtualization needs the full row model — useTable defaults to
  // client-side pagination (page size 10), so it must be disabled here.
  const { table } = useTable<BigRow>({ data, columns, pagination: false })
  const { virtualRows, totalHeight, containerRef } = useVirtualRows<BigRow>(table, {
    rowHeight: ROW_HEIGHT,
  })

  return (
    <div className="not-prose overflow-hidden rounded-lg border">
      <div role="row" className="flex border-b bg-fd-muted text-sm font-medium">
        {table.getHeaderGroups()[0]?.headers.map((h) => (
          <div key={h.id} role="columnheader" className="flex-1 px-3 py-2">
            {flexRender(h.column.columnDef.header, h.getContext())}
          </div>
        ))}
      </div>
      <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
        <div style={{ height: totalHeight, position: 'relative' }} role="table">
          {virtualRows.map(({ row, start, size }) => (
            <div
              key={row.id}
              role="row"
              className="flex border-t text-sm"
              style={{ position: 'absolute', top: start, height: size, width: '100%' }}
            >
              {row.getVisibleCells().map((cell) => (
                <div key={cell.id} role="cell" className="flex-1 px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="border-t px-3 py-2 text-xs text-fd-muted-foreground">
        10,000 rows generated in memory — only the rows visible in the 400px
        viewport (plus overscan) are mounted at any time. Scroll to see rows
        mount and unmount.
      </p>
    </div>
  )
}

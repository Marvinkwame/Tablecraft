import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { useTableA11y } from '../src/hooks/useTableA11y'
import type { UseTableA11yOptions } from '../src/hooks/useTableA11y'
import { createColumns } from '../src/helpers/createColumns'
import { flexRender } from '@tanstack/react-table'

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

// A minimal real grid, the way a consumer would wire the hook up.
function Grid(options: UseTableA11yOptions) {
  const { table } = useTable({ data: users, columns, pagination: false })
  const a11y = useTableA11y(table, options)

  return (
    <table {...a11y.getTableProps()}>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} {...a11y.getRowProps(row.id)}>
            {row.getVisibleCells().map((cell, columnIndex) => (
              <td
                key={cell.id}
                data-testid={`cell-${row.index}-${columnIndex}`}
                {...a11y.getCellProps(columnIndex, row.id)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── Cell mode ────────────────────────────────────────────

describe('useTableA11y — keyboard navigation moves real DOM focus', () => {
  it('does not steal focus on mount', () => {
    render(<Grid cellNavigation />)
    expect(document.activeElement).toBe(document.body)
  })

  it('moves focus to the cell below on ArrowDown', () => {
    const { getByTestId } = render(<Grid cellNavigation />)
    const start = getByTestId('cell-0-0')

    start.focus()
    fireEvent.keyDown(start, { key: 'ArrowDown' })

    expect(document.activeElement).toBe(getByTestId('cell-1-0'))
  })

  it('moves focus to the next column on ArrowRight', () => {
    const { getByTestId } = render(<Grid cellNavigation />)
    const start = getByTestId('cell-0-0')

    start.focus()
    fireEvent.keyDown(start, { key: 'ArrowRight' })

    expect(document.activeElement).toBe(getByTestId('cell-0-1'))
  })

  it('moves focus to the last cell of the grid on Ctrl+End', () => {
    const { getByTestId } = render(<Grid cellNavigation />)
    const start = getByTestId('cell-0-0')

    start.focus()
    fireEvent.keyDown(start, { key: 'End', ctrlKey: true })

    expect(document.activeElement).toBe(getByTestId('cell-4-1'))
  })

  it('keeps exactly one cell tabbable as focus moves', () => {
    const { getByTestId, container } = render(<Grid cellNavigation />)
    const start = getByTestId('cell-0-0')

    start.focus()
    fireEvent.keyDown(start, { key: 'ArrowDown' })

    const tabbable = container.querySelectorAll('td[tabindex="0"]')
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toBe(getByTestId('cell-1-0'))
  })
})

// ─── Row mode ─────────────────────────────────────────────

describe('useTableA11y — row mode also moves real DOM focus', () => {
  it('moves focus to the next row on ArrowDown', () => {
    const { container } = render(<Grid />)
    const rows = container.querySelectorAll('tr')

    ;(rows[0] as HTMLElement).focus()
    fireEvent.keyDown(rows[0], { key: 'ArrowDown' })

    expect(document.activeElement).toBe(rows[1])
  })
})

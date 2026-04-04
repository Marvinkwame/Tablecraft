import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import React from 'react'
import { renderHook } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { createColumns } from '../src/helpers/createColumns'
import { TablecraftDevtools } from '../devtools'

// ─── Test data ────────────────────────────────────────────

type User = { id: number; name: string; email: string; age: number }

const testData: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@test.com`,
  age: 20 + i,
}))

const columns = createColumns<User>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'age', header: 'Age' },
])

function useTestTable(options = {}) {
  return useTable({
    data: testData,
    columns,
    rowSelection: true,
    columnVisibility: true,
    ...options,
  })
}

// ─── Helper to render devtools with a real table ──────────

function renderDevtools(props: Record<string, unknown> = {}) {
  const { result } = renderHook(() => useTestTable())

  function Wrapper() {
    const tableReturn = useTestTable()
    return (
      <TablecraftDevtools
        tableReturn={tableReturn}
        {...props}
      />
    )
  }

  return { ...render(<Wrapper />), tableResult: result }
}

// ─── Tests ────────────────────────────────────────────────

describe('TablecraftDevtools', () => {
  it('renders collapsed button by default', () => {
    const { getByTestId, queryByTestId } = renderDevtools()

    expect(getByTestId('tablecraft-devtools-button')).toBeDefined()
    expect(queryByTestId('tablecraft-devtools-panel')).toBeNull()
  })

  it('opens panel on button click', () => {
    const { getByTestId, queryByTestId } = renderDevtools()

    fireEvent.click(getByTestId('tablecraft-devtools-button'))
    expect(getByTestId('tablecraft-devtools-panel')).toBeDefined()
    expect(queryByTestId('tablecraft-devtools-button')).toBeNull()
  })

  it('closes panel on close button click', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })

    expect(getByTestId('tablecraft-devtools-panel')).toBeDefined()

    fireEvent.click(getByTestId('tablecraft-devtools-close'))
    expect(getByTestId('tablecraft-devtools-button')).toBeDefined()
  })

  it('respects defaultOpen prop', () => {
    const { getByTestId, queryByTestId } = renderDevtools({ defaultOpen: true })

    expect(getByTestId('tablecraft-devtools-panel')).toBeDefined()
    expect(queryByTestId('tablecraft-devtools-button')).toBeNull()
  })

  it('displays pagination info when open', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })
    const panel = getByTestId('tablecraft-devtools-panel')

    // Should show page info
    expect(panel.textContent).toContain('Pagination')
    expect(panel.textContent).toContain('Page size')
  })

  it('displays sorting section', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })
    const panel = getByTestId('tablecraft-devtools-panel')

    expect(panel.textContent).toContain('Sorting')
    expect(panel.textContent).toContain('No active sorting')
  })

  it('displays global filter section', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })
    const panel = getByTestId('tablecraft-devtools-panel')

    expect(panel.textContent).toContain('Global Filter')
  })

  it('displays row selection section', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })
    const panel = getByTestId('tablecraft-devtools-panel')

    expect(panel.textContent).toContain('Row Selection')
    expect(panel.textContent).toContain('No rows selected')
  })

  it('displays column visibility section', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })
    const panel = getByTestId('tablecraft-devtools-panel')

    expect(panel.textContent).toContain('Column Visibility')
    expect(panel.textContent).toContain('All columns visible')
  })

  it('displays empty state section', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })
    const panel = getByTestId('tablecraft-devtools-panel')

    expect(panel.textContent).toContain('Empty State')
    expect(panel.textContent).toContain('isEmpty')
    expect(panel.textContent).toContain('false')
  })

  it('displays table info with row counts', () => {
    const { getByTestId } = renderDevtools({ defaultOpen: true })
    const panel = getByTestId('tablecraft-devtools-panel')

    expect(panel.textContent).toContain('Table')
    expect(panel.textContent).toContain('Total rows')
    expect(panel.textContent).toContain('Visible rows')
  })
})

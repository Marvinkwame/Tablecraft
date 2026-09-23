import { describe, it, expect } from 'vitest'
import { renderHook, act, fireEvent } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { useColumnResizing } from '../src/hooks/useColumnResizing'
import { createColumns } from '../src/helpers/createColumns'

type Row = { id: number; name: string; email: string }

const data: Row[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
]

const columns = createColumns<Row>([
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name', size: 150 },
  { accessorKey: 'email', header: 'Email', enableResizing: false },
])

function renderResizing(options: Record<string, unknown> = {}) {
  return renderHook(() => {
    const tableReturn = useTable({ data, columns, columnResizing: true, ...options })
    return { ...tableReturn, resizing: useColumnResizing(tableReturn.table) }
  })
}

describe('useColumnResizing', () => {
  it('reports nothing resizing initially', () => {
    const { result } = renderResizing()
    expect(result.current.resizing.resizingColumnId).toBeNull()
    expect(result.current.resizing.isResizing('name')).toBe(false)
  })

  it('returns handle props carrying both pointer handlers', () => {
    const { result } = renderResizing()
    const props = result.current.resizing.getResizeHandleProps('name')

    expect(typeof props.onMouseDown).toBe('function')
    expect(typeof props.onTouchStart).toBe('function')
  })

  it('sets touchAction none so a touch drag is not stolen by scrolling', () => {
    const { result } = renderResizing()
    expect(result.current.resizing.getResizeHandleProps('name').style.touchAction).toBe('none')
  })

  it('returns inert props for a column with enableResizing false', () => {
    const { result } = renderResizing()
    const props = result.current.resizing.getResizeHandleProps('email')

    expect(props.onMouseDown).toBeUndefined()
    expect(props.onTouchStart).toBeUndefined()
    expect(props['data-can-resize']).toBe(false)
  })

  it('returns inert props for an unknown header id rather than throwing', () => {
    const { result } = renderResizing()
    const props = result.current.resizing.getResizeHandleProps('nope')

    expect(props.onMouseDown).toBeUndefined()
    expect(props['data-can-resize']).toBe(false)
  })

  it('a drag commits a new width', () => {
    const { result } = renderResizing()
    const props = result.current.resizing.getResizeHandleProps('name')

    act(() => {
      props.onMouseDown!({ clientX: 0, persist: () => {} } as never)
    })
    act(() => {
      fireEvent.mouseMove(document, { clientX: 40 })
      fireEvent.mouseUp(document, { clientX: 40 })
    })

    expect(result.current.table.store.state.columnSizing.name).toBeGreaterThan(150)
  })

  it('defaults to onEnd, so no width is committed mid-drag', () => {
    const { result } = renderResizing()
    const props = result.current.resizing.getResizeHandleProps('name')

    act(() => {
      props.onMouseDown!({ clientX: 0, persist: () => {} } as never)
    })
    act(() => {
      fireEvent.mouseMove(document, { clientX: 40 })
    })

    // onEnd is tablecraft's default, diverging from TanStack's onChange:
    // committing on every mousemove re-renders the whole table.
    expect(result.current.table.store.state.columnSizing.name).toBeUndefined()

    act(() => {
      fireEvent.mouseUp(document, { clientX: 40 })
    })
    expect(result.current.table.store.state.columnSizing.name).toBeGreaterThan(150)
  })

  it('mode onChange commits mid-drag', () => {
    const { result } = renderResizing({ columnResizing: { mode: 'onChange' } })
    const props = result.current.resizing.getResizeHandleProps('name')

    act(() => {
      props.onMouseDown!({ clientX: 0, persist: () => {} } as never)
    })
    act(() => {
      fireEvent.mouseMove(document, { clientX: 40 })
    })

    expect(result.current.table.store.state.columnSizing.name).toBeGreaterThan(150)
  })
})

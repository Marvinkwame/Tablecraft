import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTable } from '../src/hooks/useTable'
import { useTableExport } from '../src/hooks/useTableExport'
import { createColumns } from '../src/helpers/createColumns'
import type { UseTableExportOptions } from '../src/types'

type Person = { id: number; name: string; age: number }

const people: Person[] = [
  { id: 1, name: 'Carol', age: 41 },
  { id: 2, name: 'Alice', age: 30 },
]

const columns = createColumns<Person>([
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
])

function renderExport(options: UseTableExportOptions = {}) {
  return renderHook(() => {
    const { table } = useTable<Person>({ data: people, columns })
    return useTableExport(table, options)
  })
}

describe('useTableExport', () => {
  it('returns label-keyed rows with raw values', () => {
    const { result } = renderExport()
    expect(result.current.toRows()).toEqual([
      { Name: 'Carol', Age: 41 },
      { Name: 'Alice', Age: 30 },
    ])
  })

  it('serializes CSV with a header row', () => {
    const { result } = renderExport()
    expect(result.current.toCSV()).toBe('Name,Age\r\nCarol,41\r\nAlice,30\r\n')
  })

  it('never emits a BOM from toCSV', () => {
    const { result } = renderExport()
    expect(result.current.toCSV().charCodeAt(0)).not.toBe(0xfeff)
  })

  it('serializes JSON preserving value types', () => {
    const { result } = renderExport()
    const parsed = JSON.parse(result.current.toJSON())
    expect(parsed[0]).toEqual({ Name: 'Carol', Age: 41 })
    expect(typeof parsed[0].Age).toBe('number')
  })

  it('applies hook-level options', () => {
    const { result } = renderExport({ header: false })
    expect(result.current.toCSV()).toBe('Carol,41\r\nAlice,30\r\n')
  })

  it('merges per-call overrides over hook-level options', () => {
    const { result } = renderExport({ header: false })
    expect(result.current.toCSV({ header: true })).toBe('Name,Age\r\nCarol,41\r\nAlice,30\r\n')
    expect(result.current.toCSV({ delimiter: ';' })).toBe('Carol;41\r\nAlice;30\r\n')
  })
})

describe('useTableExport download', () => {
  let clicked: HTMLAnchorElement | null = null

  beforeEach(() => {
    clicked = null
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
    globalThis.URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clicked = this
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function blobBytes(): Promise<Uint8Array> {
    const blob = vi.mocked(globalThis.URL.createObjectURL).mock.calls[0][0] as Blob
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(blob)
    })
  }

  it('defaults the filename to export.csv', () => {
    const { result } = renderExport()
    result.current.download('csv')
    expect(clicked!.download).toBe('export.csv')
  })

  it('uses the supplied filename', () => {
    const { result } = renderExport()
    result.current.download('csv', 'people.csv')
    expect(clicked!.download).toBe('people.csv')
  })

  it('prepends a UTF-8 BOM for CSV by default', async () => {
    const { result } = renderExport()
    result.current.download('csv')
    expect(Array.from((await blobBytes()).slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
  })

  it('omits the BOM when bom is false', async () => {
    const { result } = renderExport()
    result.current.download('csv', 'x.csv', { bom: false })
    expect(Array.from((await blobBytes()).slice(0, 3))).not.toEqual([0xef, 0xbb, 0xbf])
  })

  it('never adds a BOM for JSON and defaults to export.json', async () => {
    const { result } = renderExport()
    result.current.download('json')
    expect(clicked!.download).toBe('export.json')
    expect(Array.from((await blobBytes()).slice(0, 3))).not.toEqual([0xef, 0xbb, 0xbf])
  })

  it('revokes the object URL after clicking', () => {
    const { result } = renderExport()
    result.current.download('csv')
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('throws a clear error when called during server-side rendering', () => {
    const { result } = renderExport()
    vi.stubGlobal('window', undefined)
    try {
      expect(() => result.current.download('csv')).toThrow(/requires a browser environment/)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

import * as tablecraft from '../src'

describe('public export surface', () => {
  it('exports useTableExport from the root entry', () => {
    expect(typeof tablecraft.useTableExport).toBe('function')
  })
})

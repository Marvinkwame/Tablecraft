import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resolveURLKeys, parseURLState, writeURLState } from '../src/utils/url'

// ─── Helpers ──────────────────────────────────────────────

function setURL(search: string) {
  Object.defineProperty(window, 'location', {
    value: { search, pathname: '/users' },
    writable: true,
    configurable: true,
  })
}

const defaultKeys = resolveURLKeys()

describe('resolveURLKeys', () => {
  it('returns defaults when no keys provided', () => {
    const keys = resolveURLKeys()
    expect(keys).toEqual({
      page: 'page',
      pageSize: 'pageSize',
      sort: 'sort',
      filter: 'filter',
      columnFilterPrefix: 'filter_',
    })
  })

  it('merges custom keys with defaults', () => {
    const keys = resolveURLKeys({ page: 'p', filter: 'q' })
    expect(keys.page).toBe('p')
    expect(keys.filter).toBe('q')
    expect(keys.sort).toBe('sort')
    expect(keys.pageSize).toBe('pageSize')
    expect(keys.columnFilterPrefix).toBe('filter_')
  })

  it('allows overriding all keys', () => {
    const keys = resolveURLKeys({
      page: 'p',
      pageSize: 'size',
      sort: 's',
      filter: 'q',
      columnFilterPrefix: 'cf_',
    })
    expect(keys).toEqual({
      page: 'p',
      pageSize: 'size',
      sort: 's',
      filter: 'q',
      columnFilterPrefix: 'cf_',
    })
  })
})

describe('parseURLState', () => {
  beforeEach(() => {
    setURL('')
  })

  it('returns empty object when no params present', () => {
    setURL('')
    const state = parseURLState(defaultKeys)
    expect(state).toEqual({})
  })

  it('parses pagination (1-based page to 0-based pageIndex)', () => {
    setURL('?page=3&pageSize=20')
    const state = parseURLState(defaultKeys)
    expect(state.pagination).toEqual({ pageIndex: 2, pageSize: 20 })
  })

  it('parses page=1 as pageIndex=0', () => {
    setURL('?page=1')
    const state = parseURLState(defaultKeys)
    expect(state.pagination?.pageIndex).toBe(0)
  })

  it('ignores invalid page values', () => {
    setURL('?page=abc')
    const state = parseURLState(defaultKeys)
    // Should still create pagination object but with default pageIndex
    expect(state.pagination?.pageIndex).toBe(0)
  })

  it('ignores negative page values', () => {
    setURL('?page=-1')
    const state = parseURLState(defaultKeys)
    expect(state.pagination?.pageIndex).toBe(0)
  })

  it('parses single sort column', () => {
    setURL('?sort=name_asc')
    const state = parseURLState(defaultKeys)
    expect(state.sorting).toEqual([{ id: 'name', desc: false }])
  })

  it('parses multi-column sort', () => {
    setURL('?sort=name_asc,age_desc')
    const state = parseURLState(defaultKeys)
    expect(state.sorting).toEqual([
      { id: 'name', desc: false },
      { id: 'age', desc: true },
    ])
  })

  it('handles column IDs with underscores (splits on last underscore)', () => {
    setURL('?sort=created_at_desc')
    const state = parseURLState(defaultKeys)
    expect(state.sorting).toEqual([{ id: 'created_at', desc: true }])
  })

  it('parses global filter', () => {
    setURL('?filter=marvin')
    const state = parseURLState(defaultKeys)
    expect(state.globalFilter).toBe('marvin')
  })

  it('ignores empty global filter', () => {
    setURL('?filter=')
    const state = parseURLState(defaultKeys)
    expect(state.globalFilter).toBeUndefined()
  })

  it('parses column filters with prefix', () => {
    setURL('?filter_role=admin&filter_age=25')
    const state = parseURLState(defaultKeys)
    expect(state.columnFilters).toEqual([
      { id: 'role', value: 'admin' },
      { id: 'age', value: '25' },
    ])
  })

  it('uses custom keys when provided', () => {
    const keys = resolveURLKeys({ page: 'p', filter: 'q', columnFilterPrefix: 'cf_' })
    setURL('?p=2&q=hello&cf_status=active')
    const state = parseURLState(keys)
    expect(state.pagination?.pageIndex).toBe(1)
    expect(state.globalFilter).toBe('hello')
    expect(state.columnFilters).toEqual([{ id: 'status', value: 'active' }])
  })

  it('parses all state slices together', () => {
    setURL('?page=2&pageSize=25&sort=name_asc&filter=test&filter_role=admin')
    const state = parseURLState(defaultKeys)
    expect(state.pagination).toEqual({ pageIndex: 1, pageSize: 25 })
    expect(state.sorting).toEqual([{ id: 'name', desc: false }])
    expect(state.globalFilter).toBe('test')
    expect(state.columnFilters).toEqual([{ id: 'role', value: 'admin' }])
  })
})

describe('writeURLState', () => {
  let replaceStateSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    replaceStateSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/users' },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: replaceStateSpy,
        pushState: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  it('writes pagination to URL (1-based page)', () => {
    writeURLState(
      { pagination: { pageIndex: 2, pageSize: 20 }, sorting: [], columnFilters: [], globalFilter: '' },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).toContain('page=3')
    expect(url).toContain('pageSize=20')
  })

  it('omits page param when on first page', () => {
    writeURLState(
      { pagination: { pageIndex: 0, pageSize: 10 }, sorting: [], columnFilters: [], globalFilter: '' },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).not.toContain('page=')
    expect(url).toContain('pageSize=10')
  })

  it('writes sorting to URL', () => {
    writeURLState(
      {
        pagination: { pageIndex: 0, pageSize: 10 },
        sorting: [{ id: 'name', desc: false }, { id: 'created_at', desc: true }],
        columnFilters: [],
        globalFilter: '',
      },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).toContain('sort=name_asc%2Ccreated_at_desc')
  })

  it('omits sort param when empty', () => {
    writeURLState(
      { pagination: { pageIndex: 0, pageSize: 10 }, sorting: [], columnFilters: [], globalFilter: '' },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).not.toContain('sort=')
  })

  it('writes global filter to URL', () => {
    writeURLState(
      { pagination: { pageIndex: 0, pageSize: 10 }, sorting: [], columnFilters: [], globalFilter: 'marvin' },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).toContain('filter=marvin')
  })

  it('omits filter param when empty', () => {
    writeURLState(
      { pagination: { pageIndex: 0, pageSize: 10 }, sorting: [], columnFilters: [], globalFilter: '' },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).not.toContain('filter=')
  })

  it('writes column filters with prefix', () => {
    writeURLState(
      {
        pagination: { pageIndex: 0, pageSize: 10 },
        sorting: [],
        columnFilters: [{ id: 'role', value: 'admin' }, { id: 'age', value: '25' }],
        globalFilter: '',
      },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).toContain('filter_role=admin')
    expect(url).toContain('filter_age=25')
  })

  it('uses pushState when mode is push', () => {
    const pushStateSpy = vi.fn()
    Object.defineProperty(window, 'history', {
      value: { replaceState: vi.fn(), pushState: pushStateSpy },
      writable: true,
      configurable: true,
    })

    writeURLState(
      { pagination: { pageIndex: 0, pageSize: 10 }, sorting: [], columnFilters: [], globalFilter: '' },
      defaultKeys,
      'push'
    )

    expect(pushStateSpy).toHaveBeenCalled()
  })

  it('uses custom keys', () => {
    const keys = resolveURLKeys({ page: 'p', pageSize: 'size', filter: 'q', columnFilterPrefix: 'cf_' })

    writeURLState(
      {
        pagination: { pageIndex: 1, pageSize: 50 },
        sorting: [],
        columnFilters: [{ id: 'status', value: 'active' }],
        globalFilter: 'hello',
      },
      keys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    expect(url).toContain('p=2')
    expect(url).toContain('size=50')
    expect(url).toContain('q=hello')
    expect(url).toContain('cf_status=active')
  })

  it('produces clean pathname when all state is default', () => {
    writeURLState(
      { pagination: { pageIndex: 0, pageSize: 10 }, sorting: [], columnFilters: [], globalFilter: '' },
      defaultKeys
    )

    const url = replaceStateSpy.mock.calls[0][2] as string
    // Should still have pageSize
    expect(url).toContain('pageSize=10')
  })
})

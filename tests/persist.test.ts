import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPersistedState,
  savePersistedState,
  clearPersistedState,
} from '../src/utils/persist'

describe('persist utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ─── savePersistedState ───────────────────────────────────

  it('saves state to localStorage', () => {
    savePersistedState('localStorage', 'test-table', {
      sorting: [{ id: 'name', desc: false }],
      globalFilter: 'search',
    })

    const raw = localStorage.getItem('tablecraft:test-table')
    expect(raw).not.toBeNull()

    const parsed = JSON.parse(raw!)
    expect(parsed.sorting).toEqual([{ id: 'name', desc: false }])
    expect(parsed.globalFilter).toBe('search')
  })

  it('saves state to sessionStorage', () => {
    savePersistedState('sessionStorage', 'test-table', {
      sorting: [{ id: 'age', desc: true }],
    })

    const raw = sessionStorage.getItem('tablecraft:test-table')
    expect(raw).not.toBeNull()
  })

  it('respects persistOptions — skips pagination by default', () => {
    savePersistedState('localStorage', 'test-table', {
      sorting: [{ id: 'name', desc: false }],
      pagination: { pageIndex: 3, pageSize: 20 },
    })

    const parsed = JSON.parse(localStorage.getItem('tablecraft:test-table')!)
    expect(parsed.sorting).toBeDefined()
    expect(parsed.pagination).toBeUndefined()
  })

  it('can opt-in to persist pagination', () => {
    savePersistedState(
      'localStorage',
      'test-table',
      { pagination: { pageIndex: 3, pageSize: 20 } },
      { pagination: true }
    )

    const parsed = JSON.parse(localStorage.getItem('tablecraft:test-table')!)
    expect(parsed.pagination).toEqual({ pageIndex: 3, pageSize: 20 })
  })

  it('can opt-out of persisting sorting', () => {
    savePersistedState(
      'localStorage',
      'test-table',
      { sorting: [{ id: 'name', desc: false }], globalFilter: 'hello' },
      { sorting: false }
    )

    const parsed = JSON.parse(localStorage.getItem('tablecraft:test-table')!)
    expect(parsed.sorting).toBeUndefined()
    expect(parsed.globalFilter).toBe('hello')
  })

  // ─── loadPersistedState ───────────────────────────────────

  it('loads persisted state from localStorage', () => {
    localStorage.setItem(
      'tablecraft:test-table',
      JSON.stringify({
        sorting: [{ id: 'name', desc: true }],
        globalFilter: 'test',
      })
    )

    const state = loadPersistedState('localStorage', 'test-table')
    expect(state.sorting).toEqual([{ id: 'name', desc: true }])
    expect(state.globalFilter).toBe('test')
  })

  it('returns empty object when no persisted state exists', () => {
    const state = loadPersistedState('localStorage', 'nonexistent')
    expect(state).toEqual({})
  })

  it('returns empty object for corrupted data', () => {
    localStorage.setItem('tablecraft:test-table', 'not-json')
    const state = loadPersistedState('localStorage', 'test-table')
    expect(state).toEqual({})
  })

  it('respects persistOptions when loading', () => {
    localStorage.setItem(
      'tablecraft:test-table',
      JSON.stringify({
        sorting: [{ id: 'name', desc: true }],
        globalFilter: 'test',
        columnFilters: [{ id: 'role', value: 'admin' }],
      })
    )

    const state = loadPersistedState('localStorage', 'test-table', {
      sorting: true,
      globalFilter: false,
      columnFilters: true,
    })

    expect(state.sorting).toBeDefined()
    expect(state.globalFilter).toBeUndefined()
    expect(state.columnFilters).toBeDefined()
  })

  // ─── clearPersistedState ──────────────────────────────────

  it('clears persisted state', () => {
    localStorage.setItem('tablecraft:test-table', JSON.stringify({ sorting: [] }))

    clearPersistedState('localStorage', 'test-table')

    expect(localStorage.getItem('tablecraft:test-table')).toBeNull()
  })
})

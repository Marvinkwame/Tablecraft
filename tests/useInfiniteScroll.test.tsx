import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from '../src/hooks/useInfiniteScroll'

// ─── IntersectionObserver mock ────────────────────────────
// jsdom does not implement IntersectionObserver. We stub it globally
// and expose helpers to simulate intersection events in tests.

let capturedCallback: IntersectionObserverCallback | null = null
let mockObserve: ReturnType<typeof vi.fn>
let mockDisconnect: ReturnType<typeof vi.fn>
let MockIntersectionObserver: ReturnType<typeof vi.fn>

beforeEach(() => {
  capturedCallback = null
  mockObserve = vi.fn()
  mockDisconnect = vi.fn()
  MockIntersectionObserver = vi.fn().mockImplementation(
    (cb: IntersectionObserverCallback) => {
      capturedCallback = cb
      return { observe: mockObserve, disconnect: mockDisconnect }
    }
  )
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Simulate the sentinel div entering or leaving the viewport. */
function triggerIntersection(isIntersecting: boolean) {
  if (!capturedCallback) throw new Error('No IntersectionObserver callback captured — did you attach the ref?')
  capturedCallback(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver
  )
}

// ─── Tests ───────────────────────────────────────────────

describe('useInfiniteScroll', () => {
  it('calls loadMore when sentinel enters the viewport', () => {
    const loadMore = vi.fn()
    const { result } = renderHook(() => useInfiniteScroll(loadMore))
    const div = document.createElement('div')

    act(() => result.current(div))
    triggerIntersection(true)

    expect(loadMore).toHaveBeenCalledTimes(1)
  })

  it('does not create an observer when enabled is false', () => {
    const loadMore = vi.fn()
    const { result } = renderHook(() =>
      useInfiniteScroll(loadMore, { enabled: false })
    )
    const div = document.createElement('div')

    act(() => result.current(div))

    expect(MockIntersectionObserver).not.toHaveBeenCalled()
    expect(loadMore).not.toHaveBeenCalled()
  })

  it('disconnects the observer when the ref receives null (unmount)', () => {
    const loadMore = vi.fn()
    const { result } = renderHook(() => useInfiniteScroll(loadMore))
    const div = document.createElement('div')

    act(() => result.current(div))
    expect(mockObserve).toHaveBeenCalledWith(div)

    act(() => result.current(null))
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('calls the latest loadMore without stale closures after ref updates', () => {
    const loadMoreV1 = vi.fn()
    const loadMoreV2 = vi.fn()

    const { result, rerender } = renderHook(
      ({ fn }: { fn: () => void }) => useInfiniteScroll(fn),
      { initialProps: { fn: loadMoreV1 } }
    )
    const div = document.createElement('div')

    act(() => result.current(div))

    // Update the loadMore fn — the observer callback should use the new one
    rerender({ fn: loadMoreV2 })
    triggerIntersection(true)

    expect(loadMoreV1).not.toHaveBeenCalled()
    expect(loadMoreV2).toHaveBeenCalledTimes(1)
  })

  it('reconnects the observer when enabled changes from false to true', () => {
    const loadMore = vi.fn()
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useInfiniteScroll(loadMore, { enabled }),
      { initialProps: { enabled: false } }
    )
    const div = document.createElement('div')

    // enabled: false — no observer created
    act(() => result.current(div))
    expect(MockIntersectionObserver).not.toHaveBeenCalled()

    // enabled: true — useCallback returns a new ref callback, re-attach to trigger reconnect
    rerender({ enabled: true })
    act(() => result.current(div))
    triggerIntersection(true)

    expect(loadMore).toHaveBeenCalledTimes(1)
  })
})

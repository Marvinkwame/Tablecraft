'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface UseInfiniteScrollOptions {
  /** Gate the observer. Pass `hasNextPage && !isFetchingNextPage`. Default: true */
  enabled?: boolean
  /** IntersectionObserver rootMargin. Use e.g. '200px' to load ahead. Default: '0px' */
  rootMargin?: string
}

/**
 * Returns a ref callback to attach to a sentinel element at the bottom of your list.
 * When the sentinel enters the viewport and `enabled` is true, `loadMore` is called.
 *
 * Handles observer cleanup on unmount, reconnect when options change, and
 * stale-closure prevention via an internal ref for `loadMore`.
 *
 * @example
 * const sentinelRef = useInfiniteScroll(loadMore, {
 *   enabled: hasNextPage && !isFetchingNextPage,
 * })
 * return <div ref={sentinelRef} />
 */
export function useInfiniteScroll(
  loadMore: () => void,
  options: UseInfiniteScrollOptions = {}
): (node: Element | null) => void {
  const { enabled = true, rootMargin = '0px' } = options

  // Store loadMore in a ref so the observer callback never captures a stale closure.
  const loadMoreRef = useRef(loadMore)
  useEffect(() => {
    loadMoreRef.current = loadMore
  }, [loadMore])

  // Store the active observer so the ref callback can disconnect it
  // before creating a new one (handles node change and enabled toggle).
  const observerRef = useRef<IntersectionObserver | null>(null)

  return useCallback(
    (node: Element | null) => {
      // Disconnect any existing observer first
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      // Nothing to observe — disabled or unmounted
      if (!node || !enabled) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMoreRef.current()
          }
        },
        { rootMargin }
      )

      observerRef.current.observe(node)
    },
    [enabled, rootMargin]
  )
}

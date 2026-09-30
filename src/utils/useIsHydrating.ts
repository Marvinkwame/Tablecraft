'use client'

import { useSyncExternalStore } from 'react'

/** Never fires — this store's value is constant per environment. */
const subscribe = () => () => {}
const getSnapshot = () => false
const getServerSnapshot = () => true

/**
 * `true` during a server render and during the client's hydration render;
 * `false` in a client-only render and on every render after hydration.
 *
 * This exists so browser-only state (persistence, URL sync) can be read
 * synchronously in a client-only app — no flash of unstyled ordering — while
 * still producing server-matching markup when the component is server-rendered
 * and hydrated. `'use client'` does not prevent a component from rendering on
 * the server, so a hook that reads `localStorage` during render mismatches on
 * hydration unless it knows which kind of render it is in.
 *
 * React only calls `getServerSnapshot` when rendering on the server or
 * hydrating an existing tree; a plain `createRoot().render()` uses
 * `getSnapshot` from the first render onward. That asymmetry is the whole
 * mechanism — there is no other reliable way to detect a hydration render from
 * inside a hook.
 */
export function useIsHydrating(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

import { useSyncExternalStore } from 'react'

const subscribe = () => () => undefined

/**
 * `false` during SSR and hydration, `true` once React has hydrated on the client. Interactive tour widgets expose it
 * as `data-hydrated` so end-to-end tests (and styles, if ever needed) know the controls are live.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

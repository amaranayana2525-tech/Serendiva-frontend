'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * URL search-param state for admin list screens (filters, tabs, page, open drawer). Components using these hooks
 * must render inside <Suspense> (Next requirement for useSearchParams).
 */

export type UrlStateValues = Record<string, string>

export interface UrlState<T extends UrlStateValues> {
  /** Current values (URL value or the default). */
  values: T
  /** Merges a patch into the URL. Changing any key other than `page` resets `page` (when it is a managed key). */
  set: (patch: Partial<T>, options?: { history?: 'replace' | 'push' }) => void
  /** Resets the given keys (default: all managed keys) to their defaults. */
  reset: (keys?: readonly (keyof T)[]) => void
  /** True when none of the given keys (default: all except `page`) differ from the defaults. */
  isDefault: (keys?: readonly (keyof T)[]) => boolean
  /** The values that differ from the defaults (handy as an API query: empty values are never included). */
  active: Partial<T>
}

function buildHref(pathname: string, params: URLSearchParams): string {
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

/**
 * Typed URL state with defaults. Default values are omitted from the URL.
 *
 *   const filters = useUrlState({ status: '', q: '', from: '', to: '', page: '1' })
 *   filters.set({ status: 'new' })   // → ?status=new (page reset)
 */
export function useUrlState<T extends UrlStateValues>(defaults: T): UrlState<T> {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const defaultsKey = JSON.stringify(defaults)

  const values = useMemo(() => {
    const base = JSON.parse(defaultsKey) as T
    const out: UrlStateValues = { ...base }
    for (const key of Object.keys(base)) {
      const raw = searchParams.get(key)
      if (raw !== null) out[key] = raw
    }
    return out as T
  }, [searchParams, defaultsKey])

  const set = useCallback(
    (patch: Partial<T>, options?: { history?: 'replace' | 'push' }) => {
      const base = JSON.parse(defaultsKey) as T
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === '' || value === base[key]) next.delete(key)
        else next.set(key, String(value))
      }
      const changesOtherThanPage = Object.keys(patch).some((k) => k !== 'page')
      if ('page' in base && changesOtherThanPage && !('page' in patch)) next.delete('page')
      const href = buildHref(pathname, next)
      if (options?.history === 'push') router.push(href, { scroll: false })
      else router.replace(href, { scroll: false })
    },
    [defaultsKey, pathname, router, searchParams],
  )

  const reset = useCallback(
    (keys?: readonly (keyof T)[]) => {
      const base = JSON.parse(defaultsKey) as T
      const next = new URLSearchParams(searchParams.toString())
      for (const key of keys ?? Object.keys(base)) next.delete(String(key))
      router.replace(buildHref(pathname, next), { scroll: false })
    },
    [defaultsKey, pathname, router, searchParams],
  )

  const isDefault = useCallback(
    (keys?: readonly (keyof T)[]) => {
      const base = JSON.parse(defaultsKey) as T
      const list = keys ?? (Object.keys(base).filter((k) => k !== 'page') as (keyof T)[])
      return list.every((k) => values[k] === base[k])
    },
    [defaultsKey, values],
  )

  const active = useMemo(() => {
    const base = JSON.parse(defaultsKey) as T
    const out: Partial<T> = {}
    for (const key of Object.keys(base) as (keyof T)[]) {
      if (values[key] !== '' && values[key] !== base[key]) out[key] = values[key]
    }
    return out
  }, [defaultsKey, values])

  return { values, set, reset, isDefault, active }
}

export interface UrlParam {
  /** Current value or null. */
  value: string | null
  /** Sets the param (history replace by default, so closing/opening a drawer doesn't spam the back button). */
  set: (value: string | null, options?: { history?: 'replace' | 'push' }) => void
}

/** One URL search param (e.g. the `?id=` of a detail drawer). Other params are preserved. */
export function useUrlParam(name: string): UrlParam {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const value = searchParams.get(name)
  const set = useCallback(
    (next: string | null, options?: { history?: 'replace' | 'push' }) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === null || next === '') params.delete(name)
      else params.set(name, next)
      const href = buildHref(pathname, params)
      if (options?.history === 'push') router.push(href, { scroll: false })
      else router.replace(href, { scroll: false })
    },
    [name, pathname, router, searchParams],
  )
  return { value, set }
}

export interface DrawerParam {
  /** The id in the URL (drawer open) or null. */
  id: string | null
  open: (id: string) => void
  close: () => void
}

/** URL-driven drawer state: `?id=<id>` opens it (deep links from emails), close removes the param. */
export function useDrawerParam(name = 'id'): DrawerParam {
  const { value, set } = useUrlParam(name)
  const open = useCallback((id: string) => set(id), [set])
  const close = useCallback(() => set(null), [set])
  return { id: value, open, close }
}

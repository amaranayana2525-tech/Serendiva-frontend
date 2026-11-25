'use client'

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { isAbortError, toAdminApiError, type AdminApiError } from './errors'
import { adminSession } from './session'
import { toast } from './toast'

/**
 * Data hooks for the admin panel (no data library): `useAdminQuery` for reads, `useAdminMutation` for writes, and
 * `invalidateAdminQueries(resource)` to refetch mounted queries after a change (e.g. the sidebar badges).
 */

/** Query key: `['inquiries', { status, q, page }]` — the first element is the resource name used for invalidation. */
export type AdminQueryKey = string | readonly [string, ...unknown[]]

export interface AdminQueryOptions {
  /** false = don't fetch (e.g. no id selected yet). Default true. */
  enabled?: boolean
  /** Keep showing the previous key's data while the new key loads (tables while paging/filtering). Default true. */
  keepPreviousData?: boolean
  /** Poll every n ms (e.g. sidebar counts). */
  refetchInterval?: number
}

export interface AdminQueryResult<T> {
  data: T | undefined
  /** Last error (null while a retry is in flight). Never set for aborted requests or an expired session. */
  error: AdminApiError | null
  /** True while there is no data for the current key yet (show a skeleton). */
  loading: boolean
  /** True while any request for this query is in flight (show a subtle spinner). */
  fetching: boolean
  /** Re-runs the fetcher; resolves when it settled. */
  refetch: () => Promise<void>
  /** Locally replace the data (optimistic updates after a mutation). */
  setData: (updater: T | ((previous: T | undefined) => T | undefined)) => void
}

const resourceOf = (key: AdminQueryKey): string => (typeof key === 'string' ? key : key[0])

/** Last good data per key string — mounted components with the same key start from it (stale-while-revalidate). */
const cache = new Map<string, unknown>()
const MAX_CACHE = 200

interface RegistryEntry {
  resource: string
  keyString: string
  refetch: () => Promise<void>
}
const registry = new Set<RegistryEntry>()

/**
 * Refetches every mounted query whose resource (first key element) matches, and drops matching cache entries.
 * `invalidateAdminQueries('stats')`, `invalidateAdminQueries(['inquiries', 'stats'])`, or no argument for all.
 */
export function invalidateAdminQueries(match?: string | readonly string[] | ((resource: string) => boolean)): void {
  const test =
    match === undefined
      ? () => true
      : typeof match === 'function'
        ? match
        : typeof match === 'string'
          ? (r: string) => r === match
          : (r: string) => match.includes(r)
  for (const key of [...cache.keys()]) {
    try {
      const parsed = JSON.parse(key) as [AdminQueryKey]
      if (test(resourceOf(parsed[0]))) cache.delete(key)
    } catch {
      cache.delete(key)
    }
  }
  for (const entry of registry) if (test(entry.resource)) void entry.refetch()
}

interface Settled<T> {
  keyString: string
  token: number
  data: T | undefined
  error: AdminApiError | null
}

/**
 * Loads data with abort-on-unmount/key-change, loading/error/data state and refetch.
 *
 *   const { data, loading, error, refetch } = useAdminQuery(
 *     ['inquiries', query],
 *     (signal) => unwrap(adminApi.GET('/api/v1/admin/inquiries', { params: { query }, signal })),
 *   )
 *
 * `key` must capture everything the fetcher depends on; `deps` are extra serialisable values appended to it.
 */
export function useAdminQuery<T>(
  key: AdminQueryKey,
  fn: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[] = [],
  options: AdminQueryOptions = {},
): AdminQueryResult<T> {
  const { enabled = true, keepPreviousData = true, refetchInterval } = options
  const keyString = JSON.stringify([key, deps])
  const resource = resourceOf(key)

  const [token, setToken] = useState(0)
  const [settled, setSettled] = useState<Settled<T>>(() => ({
    keyString: '',
    token: -1,
    data: cache.get(keyString) as T | undefined,
    error: null,
  }))
  const waiters = useRef(new Map<number, (() => void)[]>())

  const runFetcher = useEffectEvent((signal: AbortSignal) => fn(signal))

  useEffect(() => {
    if (!enabled) {
      // Nothing will run: release anyone awaiting refetch().
      for (const list of waiters.current.values()) list.forEach((resolve) => resolve())
      waiters.current.clear()
      return
    }
    const controller = new AbortController()
    const myToken = token
    const finish = () => {
      const list = waiters.current.get(myToken)
      waiters.current.delete(myToken)
      list?.forEach((resolve) => resolve())
    }
    runFetcher(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return
        cache.set(keyString, data)
        if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value as string)
        setSettled({ keyString, token: myToken, data, error: null })
        finish()
      },
      (raw: unknown) => {
        if (controller.signal.aborted || isAbortError(raw)) return
        const error = toAdminApiError(raw)
        // The session ended and the browser is on its way to the login page — keep showing the loading state.
        if (error.isUnauthorized && adminSession.expired) return
        setSettled((prev) => ({
          keyString,
          token: myToken,
          data: prev.keyString === keyString ? prev.data : (cache.get(keyString) as T | undefined),
          error,
        }))
        finish()
      },
    )
    return () => controller.abort()
  }, [keyString, enabled, token])

  const refetch = useCallback(() => {
    return new Promise<void>((resolve) => {
      setToken((t) => {
        const next = t + 1
        const list = waiters.current.get(next) ?? []
        list.push(resolve)
        waiters.current.set(next, list)
        return next
      })
    })
  }, [])

  // Register for invalidation.
  useEffect(() => {
    const entry: RegistryEntry = { resource, keyString, refetch }
    registry.add(entry)
    return () => {
      registry.delete(entry)
    }
  }, [resource, keyString, refetch])

  // Optional polling.
  useEffect(() => {
    if (!enabled || !refetchInterval) return
    const id = window.setInterval(() => void refetch(), refetchInterval)
    return () => window.clearInterval(id)
  }, [enabled, refetchInterval, refetch])

  const setData = useCallback(
    (updater: T | ((previous: T | undefined) => T | undefined)) => {
      setSettled((prev) => {
        const nextData =
          typeof updater === 'function' ? (updater as (p: T | undefined) => T | undefined)(prev.data) : updater
        if (nextData !== undefined) cache.set(prev.keyString || keyString, nextData)
        return { ...prev, data: nextData }
      })
    },
    [keyString],
  )

  const isCurrent = settled.keyString === keyString
  const cached = cache.get(keyString) as T | undefined
  const data = isCurrent ? settled.data : (cached ?? (keepPreviousData ? settled.data : undefined))
  const fetching = enabled && (!isCurrent || settled.token !== token)
  const error = isCurrent && settled.token === token ? settled.error : null

  return { data, error, loading: fetching && data === undefined, fetching, refetch, setData }
}

/** Maps an AdminApiError to a short user-facing sentence (network / rate limit / validation / server / API text). */
export function useAdminErrorMessage(): (error: unknown) => string {
  const t = useTranslations('admin.errors')
  return useCallback(
    (raw: unknown) => {
      const error = toAdminApiError(raw)
      if (error.isNetworkError) return t('network')
      if (error.isValidationError) return t('validation')
      if (error.status === 404) return t('notFound')
      if (error.status === 403) return t('forbidden')
      if (error.status >= 500) return t('server')
      return error.message || t('generic')
    },
    [t],
  )
}

export type MutationResult<R> = { ok: true; data: R } | { ok: false; error: AdminApiError }

export interface AdminMutationOptions<R, A extends unknown[]> {
  /** Toast after success (string or builder). Omit/false for none. */
  successToast?: string | ((data: R, ...args: A) => string) | false
  /** Error toast: true (default) = automatic message (+ the first validation issues); string/builder; false = none. */
  errorToast?: boolean | string | ((error: AdminApiError) => string)
  onSuccess?: (data: R, ...args: A) => void
  onError?: (error: AdminApiError) => void
  /** Resources to invalidate after success, e.g. ['inquiries', 'stats']. */
  invalidate?: readonly string[]
}

export interface AdminMutation<A extends unknown[], R> {
  /** Runs the mutation; never throws — check `result.ok`. */
  mutate: (...args: A) => Promise<MutationResult<R>>
  pending: boolean
  error: AdminApiError | null
  reset: () => void
}

/**
 * Wraps a write call with pending/error state, toasts and invalidation.
 *
 *   const save = useAdminMutation((id: string, body: InquiryUpdateBody) => unwrap(adminApi.PATCH(...)), {
 *     successToast: t('saved'), invalidate: ['inquiries', 'stats'],
 *   })
 *   const result = await save.mutate(id, { status: 'replied' })
 */
export function useAdminMutation<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  options: AdminMutationOptions<R, A> = {},
): AdminMutation<A, R> {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const describe = useAdminErrorMessage()

  const mutate = async (...args: A): Promise<MutationResult<R>> => {
    setPending(true)
    setError(null)
    try {
      const data = await fn(...args)
      setPending(false)
      const { successToast, onSuccess, invalidate } = options
      if (successToast) toast.success(typeof successToast === 'function' ? successToast(data, ...args) : successToast)
      if (invalidate?.length) invalidateAdminQueries(invalidate)
      onSuccess?.(data, ...args)
      return { ok: true, data }
    } catch (raw) {
      const err = toAdminApiError(raw)
      setPending(false)
      if (err.isUnauthorized && adminSession.expired) return { ok: false, error: err }
      setError(err)
      const { errorToast = true, onError } = options
      if (errorToast !== false) {
        const title =
          typeof errorToast === 'string' ? errorToast : typeof errorToast === 'function' ? errorToast(err) : describe(err)
        const description = err.isValidationError
          ? err.issues.slice(0, 4).map((i) => (i.path === '_form' ? i.message : `${i.path}: ${i.message}`))
          : typeof errorToast !== 'boolean' && !err.isNetworkError
            ? err.message
            : undefined
        toast.error(title, description)
      }
      onError?.(err)
      return { ok: false, error: err }
    }
  }

  const reset = useCallback(() => setError(null), [])
  return { mutate, pending, error, reset }
}

/** Debounces a value (search inputs). */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

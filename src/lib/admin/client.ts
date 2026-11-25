import createClient, { type Client, type Middleware } from 'openapi-fetch'
import type { paths } from '@/lib/api/schema'
import type { MediaUploadResult } from '@/lib/api/types'
import { AdminApiError, errorFromResponse, readErrorResponse, toAdminApiError } from './errors'
import { adminSession, isSessionEndpoint, type SessionManager } from './session'

/**
 * Admin API client (browser only).
 *
 *   const list = await unwrap(adminApi.GET('/api/v1/admin/inquiries', { params: { query: { status, q } }, signal }))
 *
 * - Same-origin through the Next.js rewrite (`/api/v1/*` → API), `credentials: 'include'`, so the httpOnly session
 *   cookies are first-party. Never call NEXT_PUBLIC_API_URL from admin code.
 * - On a 401 from any non-auth endpoint: single-flight POST /auth/refresh, then the request is retried ONCE.
 *   If the refresh fails the browser goes to /admin/login?next=<current path>.
 * - Empty query values ('' / null / undefined) are dropped (the API rejects `status=`).
 * - `unwrap()` returns the data or throws a typed `AdminApiError`.
 */

export type AdminClient = Client<paths>

export const ADMIN_API_BASE = '/api/v1/admin'

type QueryValue = string | number | boolean | null | undefined | readonly (string | number | boolean)[]

/** Serialises a query object, dropping empty values; arrays repeat the key. Returns '' or 'a=1&b=2' (no '?'). */
export function serializeQuery(query: Record<string, unknown> | undefined | null): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, raw] of Object.entries(query)) {
    const value = raw as QueryValue
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const v of value) if (v !== '' && v !== null && v !== undefined) params.append(key, String(v))
    } else {
      params.append(key, String(value))
    }
  }
  return params.toString()
}

/** Removes empty values ('' / null / undefined / []) from a query object. */
export function cleanQuery<T extends Record<string, unknown>>(query: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(query) as [keyof T, unknown][]) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue
    out[k] = v as T[keyof T]
  }
  return out
}

/**
 * openapi-fetch middleware: remembers a clone of every request, and on a 401 (non-auth endpoint) refreshes the
 * session once (shared by concurrent requests) and replays the clone. A failed refresh — or a second 401 — ends the
 * session (`session.expire()` → redirect to the login page) and passes the 401 through.
 */
export function createRefreshMiddleware(session: SessionManager): Middleware {
  const replayable = new Map<string, Request>()
  return {
    onRequest({ request, id }) {
      if (!isSessionEndpoint(request.url)) replayable.set(id, request.clone())
      return undefined
    },
    async onResponse({ response, id, options }) {
      const replay = replayable.get(id)
      replayable.delete(id)
      if (response.status !== 401 || !replay) return undefined
      if (session.expired) return undefined
      const refreshed = await session.refresh()
      if (!refreshed) {
        session.expire()
        return undefined
      }
      // Call fetch unbound: `options.fetch(...)` would run window.fetch with `this = options` → "Illegal invocation".
      const fetchImpl = options.fetch
      const retried = await fetchImpl(replay)
      if (retried.status === 401) session.expire()
      return retried
    },
    onError({ id }) {
      replayable.delete(id)
      return undefined
    },
  }
}

export interface AdminClientOptions {
  /** '' in the browser (same origin). Tests pass an absolute origin. */
  baseUrl?: string
  fetch?: typeof fetch
  session?: SessionManager
}

/** Creates a typed admin client with the refresh middleware (the app uses the shared `adminApi`). */
export function createAdminClient(options: AdminClientOptions = {}): AdminClient {
  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? '',
    credentials: 'include',
    ...(options.fetch ? { fetch: options.fetch } : {}),
    querySerializer: (query) => serializeQuery(query as Record<string, unknown>),
  })
  client.use(createRefreshMiddleware(options.session ?? adminSession))
  return client
}

/** The shared admin API client. */
export const adminApi: AdminClient = createAdminClient()

type ApiResult<D> = { data?: D; error?: unknown; response: Response }
/** `never` (204 endpoints) becomes `void` so `await unwrap(DELETE …)` keeps normal control flow. */
export type Unwrapped<D> = [D] extends [never] ? void : D

/**
 * Resolves an openapi-fetch call to its data or throws an `AdminApiError` (network failures included).
 *   const tour = await unwrap(adminApi.GET('/api/v1/admin/tours/{id}', { params: { path: { id } } }))
 */
export async function unwrap<D>(call: Promise<ApiResult<D>>): Promise<Unwrapped<D>> {
  let result: ApiResult<D>
  try {
    result = await call
  } catch (error) {
    throw toAdminApiError(error)
  }
  if (result.response.ok) return result.data as Unwrapped<D>
  throw errorFromResponse(result.response, result.error)
}

// ---------------------------------------------------------------------------------------------- raw fetch helpers

export interface AdminFetchOptions {
  baseUrl?: string
  fetch?: typeof fetch
  session?: SessionManager
}

/** Creates a fetch function with the same refresh-on-401 behaviour as the typed client (for blobs, CSV, multipart). */
export function createAdminFetch(options: AdminFetchOptions = {}) {
  const baseUrl = (options.baseUrl ?? '').replace(/\/+$/, '')
  const session = options.session ?? adminSession
  return async function adminFetchImpl(path: string, init: RequestInit = {}): Promise<Response> {
    const fetchImpl = options.fetch ?? globalThis.fetch
    const url = /^https?:\/\//.test(path) ? path : `${baseUrl}${path}`
    const request = new Request(url, { credentials: 'include', ...init })
    const replay = isSessionEndpoint(url) ? null : request.clone()
    let response: Response
    try {
      response = await fetchImpl(request)
    } catch (error) {
      throw toAdminApiError(error)
    }
    if (response.status !== 401 || !replay || session.expired) return response
    const refreshed = await session.refresh()
    if (!refreshed) {
      session.expire()
      return response
    }
    try {
      const retried = await fetchImpl(replay)
      if (retried.status === 401) session.expire()
      return retried
    } catch (error) {
      throw toAdminApiError(error)
    }
  }
}

/** `fetch` for admin endpoints the typed client can't express (binary downloads, multipart). Same-origin + refresh. */
export const adminFetch = createAdminFetch()

/** Appends a cleaned query string to a path. */
export function withQuery(path: string, query?: Record<string, unknown> | null): string {
  const qs = serializeQuery(query)
  if (!qs) return path
  return `${path}${path.includes('?') ? '&' : '?'}${qs}`
}

/** `attachment; filename="inquiries-2026-10-05.csv"` → `inquiries-2026-10-05.csv` (RFC 5987 `filename*` too). */
export function filenameFromDisposition(header: string | null | undefined): string | undefined {
  if (!header) return undefined
  const star = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(header)
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''))
    } catch {
      /* fall through */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() || undefined
}

/** Triggers a browser download of a Blob. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export interface DownloadOptions {
  query?: Record<string, unknown>
  /** Used when the response has no Content-Disposition filename. */
  fallbackFilename?: string
  signal?: AbortSignal
}

/**
 * Downloads an authenticated file (CSV export, proposal attachment) via fetch → blob → <a download>.
 * Throws AdminApiError on failure. Resolves with the filename used.
 */
export async function downloadFile(path: string, options: DownloadOptions = {}): Promise<string> {
  const response = await adminFetch(withQuery(path, options.query), { method: 'GET', signal: options.signal })
  if (!response.ok) throw await readErrorResponse(response)
  const blob = await response.blob()
  const filename =
    filenameFromDisposition(response.headers.get('content-disposition')) ?? options.fallbackFilename ?? 'download'
  saveBlob(blob, filename)
  return filename
}

/** CSV export of the current filters: `downloadCsv('inquiries', { status, q })` → GET /api/v1/admin/inquiries/export.csv. */
export function downloadCsv(
  resource: 'inquiries' | 'proposals' | 'newsletter',
  query: Record<string, unknown> = {},
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  return downloadFile(`${ADMIN_API_BASE}/${resource}/export.csv`, {
    query,
    fallbackFilename: `${resource}-${today}.csv`,
  })
}

export interface UploadProgress {
  loaded: number
  total: number
  /** 0–1 */
  fraction: number
}

export interface MultipartOptions {
  method?: 'POST' | 'PUT' | 'PATCH'
  onProgress?: (progress: UploadProgress) => void
  signal?: AbortSignal
  session?: SessionManager
}

function xhrSend(url: string, body: FormData, options: MultipartOptions): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options.method ?? 'POST', url)
    xhr.withCredentials = true
    xhr.setRequestHeader('accept', 'application/json')
    xhr.responseType = 'text'
    if (options.onProgress) {
      xhr.upload.onprogress = (e) => {
        const total = e.lengthComputable ? e.total : 0
        options.onProgress?.({ loaded: e.loaded, total, fraction: total ? e.loaded / total : 0 })
      }
    }
    xhr.onload = () => {
      const headers = new Headers()
      for (const line of xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
        const idx = line.indexOf(':')
        if (idx > 0) headers.append(line.slice(0, idx).trim(), line.slice(idx + 1).trim())
      }
      const status = xhr.status
      resolve(new Response(status === 204 ? null : xhr.responseText, { status, headers }))
    }
    xhr.onerror = () => reject(new TypeError('Network error'))
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))
    if (options.signal) {
      if (options.signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      options.signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.send(body)
  })
}

/**
 * Sends multipart/form-data with upload progress (XMLHttpRequest) and the same refresh-on-401 behaviour.
 * Never set Content-Type yourself (the browser adds the boundary). Returns the parsed JSON body.
 */
export async function sendMultipart<T>(path: string, form: FormData, options: MultipartOptions = {}): Promise<T> {
  const session = options.session ?? adminSession
  let response: Response
  try {
    response = await xhrSend(path, form, options)
    if (response.status === 401 && !session.expired) {
      if (!(await session.refresh())) {
        session.expire()
      } else {
        response = await xhrSend(path, form, options)
        if (response.status === 401) session.expire()
      }
    }
  } catch (error) {
    throw toAdminApiError(error)
  }
  if (!response.ok) throw await readErrorResponse(response)
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export interface UploadMediaOptions extends Omit<MultipartOptions, 'method'> {
  /** English alt text applied to every uploaded image (can be edited per file later). */
  altText?: string
  /** Optional folder name (e.g. 'tours'). */
  folder?: string
}

/** Max files per request and per-file size accepted by POST /api/v1/admin/media. */
export const MEDIA_UPLOAD_LIMITS = { maxFiles: 20, maxBytes: 10 * 1024 * 1024 } as const

/**
 * Uploads up to 20 files (≤ 10 MB each) to the media library. ALWAYS check `result.errors` — rejected files are
 * listed there while the others are saved.
 */
export async function uploadMedia(files: File[] | FileList, options: UploadMediaOptions = {}): Promise<MediaUploadResult> {
  const list = Array.from(files)
  if (list.length === 0) return { items: [], errors: [] }
  if (list.length > MEDIA_UPLOAD_LIMITS.maxFiles) {
    throw new AdminApiError({
      status: 400,
      code: 'TOO_MANY_FILES',
      message: `Upload at most ${MEDIA_UPLOAD_LIMITS.maxFiles} files at once`,
    })
  }
  const form = new FormData()
  // Text fields first (streaming multipart parsers see them before the files).
  if (options.altText) form.append('altText', options.altText)
  if (options.folder) form.append('folder', options.folder)
  for (const file of list) form.append('files', file, file.name)
  return sendMultipart<MediaUploadResult>(`${ADMIN_API_BASE}/media`, form, options)
}

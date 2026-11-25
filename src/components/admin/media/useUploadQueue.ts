'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MEDIA_UPLOAD_LIMITS, uploadMedia } from '@/lib/admin/client'
import { toAdminApiError } from '@/lib/admin/errors'
import { useAdminErrorMessage } from '@/lib/admin/hooks'
import { formatBytes } from '@/lib/admin/format'
import type { AdminMedia } from '@/lib/api/types'

/**
 * Multi-file upload queue for POST /api/v1/admin/media. Every file is sent in its own request (a few in parallel), so
 * each file gets its own progress bar and its own error — taken from the response's `errors[]` (rejected by the API)
 * or from the request failure. Successful files are reported through `onUploaded`.
 */

export type UploadAccept = 'image' | 'any'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] as const
export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
export const ACCEPT_ATTR: Record<UploadAccept, string> = {
  image: IMAGE_TYPES.join(','),
  any: [...IMAGE_TYPES, ...DOCUMENT_TYPES].join(','),
}

export type UploadStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'error'

export interface UploadEntry {
  key: string
  name: string
  size: number
  isImage: boolean
  /** Local object URL for an instant preview (images only). */
  previewUrl: string | null
  status: UploadStatus
  /** Upload progress 0–1 (the server then converts the image: status "processing"). */
  progress: number
  error?: string
  media?: AdminMedia
}

interface Job {
  key: string
  file: File
  folder?: string
  altText?: string
}

export interface UploadQueueOptions {
  /** Storage folder (e.g. "gallery"). Read when files are added. */
  folder?: string
  /** English alt text applied to every file added from now on. */
  altText?: string
  accept?: UploadAccept
  /** Parallel requests (default 2 — the API converts images one after another anyway). */
  concurrency?: number
  /** Called once per successfully stored file. */
  onUploaded?: (media: AdminMedia) => void
}

export interface UploadQueue {
  entries: UploadEntry[]
  /** Validates (type, 10 MB) and queues files; uploads start immediately. */
  add: (files: readonly File[]) => void
  /** Removes one finished/failed row. */
  dismiss: (key: string) => void
  /** Removes every finished and failed row. */
  clearFinished: () => void
  /** True while any file is queued, uploading or processing. */
  busy: boolean
  /** Files stored so far (in upload order). */
  uploaded: AdminMedia[]
  counts: { done: number; failed: number; pending: number }
}

let seq = 0
const isPending = (e: UploadEntry) => e.status === 'queued' || e.status === 'uploading' || e.status === 'processing'

export function useUploadQueue(options: UploadQueueOptions = {}): UploadQueue {
  const t = useTranslations('adminLibrary.upload')
  const describe = useAdminErrorMessage()
  const { accept = 'image', concurrency = 2 } = options
  const [entries, setEntries] = useState<UploadEntry[]>([])
  // Mutable queue state shared by the async workers (never read during render).
  const box = useRef({
    jobs: [] as Job[],
    active: 0,
    previews: new Map<string, string>(),
    controller: null as AbortController | null,
    onUploaded: options.onUploaded,
  })

  useEffect(() => {
    box.current.onUploaded = options.onUploaded
  })

  // Cancel running uploads and free the previews when the uploader goes away.
  useEffect(() => {
    const state = box.current
    return () => {
      state.controller?.abort()
      state.controller = null
      for (const url of state.previews.values()) URL.revokeObjectURL(url)
      state.previews.clear()
    }
  }, [])

  const patch = (key: string, next: Partial<UploadEntry>) =>
    setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...next } : e)))

  const signal = () => {
    const state = box.current
    if (!state.controller || state.controller.signal.aborted) state.controller = new AbortController()
    return state.controller.signal
  }

  function pump() {
    const state = box.current
    while (state.active < concurrency && state.jobs.length > 0) {
      const job = state.jobs.shift()
      if (job) void run(job)
    }
  }

  async function run(job: Job) {
    box.current.active++
    patch(job.key, { status: 'uploading', progress: 0 })
    try {
      const result = await uploadMedia([job.file], {
        folder: job.folder,
        altText: job.altText,
        signal: signal(),
        onProgress: (p) =>
          patch(job.key, p.fraction >= 0.999 ? { status: 'processing', progress: 1 } : { progress: p.fraction }),
      })
      const media = result.items[0]
      if (media) {
        patch(job.key, { status: 'done', progress: 1, media })
        box.current.onUploaded?.(media)
      } else {
        patch(job.key, { status: 'error', error: result.errors[0]?.message ?? t('failed') })
      }
    } catch (raw) {
      const err = toAdminApiError(raw)
      if (err.code !== 'ABORTED') {
        patch(job.key, {
          status: 'error',
          error: err.isNetworkError || err.status >= 500 ? describe(err) : err.message,
        })
      }
    } finally {
      box.current.active--
      pump()
    }
  }

  const add = (files: readonly File[]) => {
    if (!files.length) return
    const allowed: readonly string[] = accept === 'image' ? IMAGE_TYPES : [...IMAGE_TYPES, ...DOCUMENT_TYPES]
    const next: UploadEntry[] = []
    for (const file of files) {
      const key = `up${++seq}`
      const isImage = file.type.startsWith('image/')
      let error: string | undefined
      if (file.size > MEDIA_UPLOAD_LIMITS.maxBytes)
        error = t('tooBig', { max: formatBytes(MEDIA_UPLOAD_LIMITS.maxBytes) })
      else if (file.size === 0) error = t('empty')
      else if (file.type && !allowed.includes(file.type)) error = t(accept === 'image' ? 'notImage' : 'badType')
      let previewUrl: string | null = null
      if (isImage && !error) {
        previewUrl = URL.createObjectURL(file)
        box.current.previews.set(key, previewUrl)
      }
      next.push({
        key,
        name: file.name,
        size: file.size,
        isImage,
        previewUrl,
        status: error ? 'error' : 'queued',
        progress: 0,
        error,
      })
      if (!error)
        box.current.jobs.push({
          key,
          file,
          folder: options.folder || undefined,
          altText: options.altText?.trim() || undefined,
        })
    }
    setEntries((list) => [...list, ...next])
    pump()
  }

  const release = (keys: string[]) => {
    for (const key of keys) {
      const url = box.current.previews.get(key)
      if (url) URL.revokeObjectURL(url)
      box.current.previews.delete(key)
    }
  }

  const dismiss = (key: string) => {
    release([key])
    setEntries((list) => list.filter((e) => e.key !== key))
  }

  const clearFinished = () => {
    release(entries.filter((e) => !isPending(e)).map((e) => e.key))
    setEntries((list) => list.filter(isPending))
  }

  const counts = {
    done: entries.filter((e) => e.status === 'done').length,
    failed: entries.filter((e) => e.status === 'error').length,
    pending: entries.filter(isPending).length,
  }
  return {
    entries,
    add,
    dismiss,
    clearFinished,
    busy: counts.pending > 0,
    uploaded: entries.flatMap((e) => (e.status === 'done' && e.media ? [e.media] : [])),
    counts,
  }
}

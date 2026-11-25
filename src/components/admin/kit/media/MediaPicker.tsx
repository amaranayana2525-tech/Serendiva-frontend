'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { adminApi, MEDIA_UPLOAD_LIMITS, unwrap, uploadMedia } from '@/lib/admin/client'
import { toAdminApiError } from '@/lib/admin/errors'
import { formatBytes } from '@/lib/admin/format'
import { useAdminErrorMessage, useAdminQuery, useDebouncedValue } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import type { AdminMedia } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { AdminPagination } from '../AdminPagination'
import { Button } from '../Button'
import { Modal } from '../Modal'
import { ErrorPanel, LoadingPanel } from '../Panels'
import { MediaThumb } from './MediaThumb'

export interface MediaPickerProps {
  open: boolean
  onClose: () => void
  /** Called with the chosen items (in selection order); the picker closes itself afterwards. */
  onSelect: (media: AdminMedia[]) => void
  /** Allow selecting several files (default false). */
  multiple?: boolean
  /** Limit for multiple selection. */
  max?: number
  /** Which media to list: images (default), documents, or any. */
  accept?: 'image' | 'document' | 'any'
  /** Storage folder for uploads made from the picker (e.g. 'tours'). */
  folder?: string
  title?: string
}

const PAGE_SIZE = 24
const ACCEPT_ATTR = {
  image: 'image/jpeg,image/png,image/webp,image/avif,image/gif',
  document: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  any: 'image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const

/**
 * Media library dialog: browse (paged), search, upload (multi-file, with progress and per-file errors) and pick one
 * or many files. Mount it conditionally or keep it mounted with `open`.
 */
export function MediaPicker(props: MediaPickerProps) {
  // Remount on every open so search/selection start fresh.
  if (!props.open) return null
  return <MediaPickerDialog {...props} />
}

function MediaPickerDialog({
  onClose,
  onSelect,
  multiple = false,
  max,
  accept = 'image',
  folder,
  title,
}: MediaPickerProps) {
  const t = useTranslations('admin.kit.media')
  const describe = useAdminErrorMessage()
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim(), 300)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminMedia[]>([])
  const [upload, setUpload] = useState<{ fraction: number; count: number } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const query = { q: q || undefined, type: accept === 'any' ? undefined : accept, page, pageSize: PAGE_SIZE }
  const list = useAdminQuery(['media', query], (signal) =>
    unwrap(adminApi.GET('/api/v1/admin/media', { params: { query }, signal })),
  )

  const isSelected = (m: AdminMedia) => selected.some((s) => s.id === m.id)
  const toggle = (m: AdminMedia) => {
    if (!multiple) {
      setSelected(isSelected(m) ? [] : [m])
      return
    }
    if (isSelected(m)) setSelected(selected.filter((s) => s.id !== m.id))
    else if (max === undefined || selected.length < max) setSelected([...selected, m])
    else toast.info(t('maxSelected', { max }))
  }

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const all = Array.from(files)
    const tooBig = all.filter((f) => f.size > MEDIA_UPLOAD_LIMITS.maxBytes)
    const ok = all.filter((f) => f.size <= MEDIA_UPLOAD_LIMITS.maxBytes).slice(0, MEDIA_UPLOAD_LIMITS.maxFiles)
    if (tooBig.length) toast.error(t('tooBig'), tooBig.map((f) => f.name))
    if (!ok.length) return
    setUpload({ fraction: 0, count: ok.length })
    try {
      const result = await uploadMedia(ok, {
        folder,
        onProgress: (p) => setUpload({ fraction: p.fraction, count: ok.length }),
      })
      if (result.items.length) {
        toast.success(t('uploaded', { count: result.items.length }))
        const usable = result.items.filter((m) => accept === 'any' || (accept === 'image') === m.mime.startsWith('image/'))
        setSelected((prev) => {
          if (!multiple) return usable.slice(-1)
          const merged = [...prev, ...usable.filter((u) => !prev.some((p) => p.id === u.id))]
          return max === undefined ? merged : merged.slice(0, max)
        })
      }
      if (result.errors.length) {
        toast.error(
          t('uploadErrors', { count: result.errors.length }),
          result.errors.map((e) => `${e.fileName}: ${e.message}`),
        )
      }
      setPage(1)
      setSearch('')
      void list.refetch()
    } catch (error) {
      const err = toAdminApiError(error)
      toast.error(t('uploadFailed'), describe(err))
    } finally {
      setUpload(null)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const data = list.data
  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={title ?? (multiple ? t('titleMultiple') : t('title'))}
      description={multiple ? t('descriptionMultiple') : t('description')}
      bodyClassName="flex flex-col gap-4"
      footer={
        <>
          <span className="mr-auto font-body-md text-body-md text-on-surface-variant" aria-live="polite">
            {t('selectedCount', { count: selected.length })}
          </span>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            icon="check"
            disabled={selected.length === 0}
            onClick={() => {
              onSelect(selected)
              onClose()
            }}
          >
            {multiple ? t('confirmMultiple', { count: selected.length }) : t('confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{t('search')}</span>
          <Icon
            name="search"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('searchPlaceholder')}
            className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 font-body-md text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT_ATTR[accept]}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button icon="upload" onClick={() => fileInput.current?.click()} loading={upload !== null}>
          {t('upload')}
        </Button>
      </div>

      {upload && (
        <div className="flex flex-col gap-1" role="status">
          <span className="font-caption text-caption text-on-surface-variant">
            {t('uploading', { count: upload.count, percent: Math.round(upload.fraction * 100) })}
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.round(upload.fraction * 100)}%` }} />
          </div>
        </div>
      )}

      {list.error && !data ? (
        <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
      ) : list.loading ? (
        <LoadingPanel variant="cards" rows={8} card={false} />
      ) : data && data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant px-6 py-10 text-center">
          <Icon name="photo_library" className="text-[32px] text-outline" />
          <p className="font-body-md text-body-md text-on-surface-variant">{q ? t('noResults') : t('empty')}</p>
        </div>
      ) : (
        <ul
          aria-label={t('gridLabel')}
          className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', list.fetching && 'opacity-60')}
        >
          {data?.items.map((m) => {
            const active = isSelected(m)
            const order = selected.findIndex((s) => s.id === m.id)
            const alt = m.altText.en ?? ''
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(m)}
                  onDoubleClick={() => {
                    if (!multiple) {
                      onSelect([m])
                      onClose()
                    }
                  }}
                  className={cn(
                    'group flex w-full flex-col overflow-hidden rounded-lg border-2 bg-surface-container-lowest text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    active ? 'border-primary' : 'border-transparent hover:border-outline-variant',
                  )}
                >
                  <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface-container">
                    <MediaThumb media={{ url: m.url, thumbUrl: m.thumbUrl, alt, mime: m.mime }} sizes="180px" />
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1 font-body-md text-[12px] font-semibold text-on-primary shadow">
                        {multiple ? order + 1 : <Icon name="check" className="text-[16px]" />}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col px-1.5 py-1">
                    <span className="truncate font-caption text-caption text-on-surface">{m.originalName ?? alt ?? m.id}</span>
                    <span className="truncate font-caption text-[11px] text-on-surface-variant">
                      {m.width && m.height ? `${m.width}×${m.height} · ` : ''}
                      {formatBytes(m.size)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {data && data.meta.totalPages > 1 && (
        <AdminPagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          pageSize={data.meta.pageSize}
          onPageChange={setPage}
        />
      )}
    </Modal>
  )
}

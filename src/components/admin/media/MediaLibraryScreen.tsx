'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdminPagination } from '@/components/admin/kit/AdminPagination'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { FilterBar } from '@/components/admin/kit/FilterBar'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { TextField } from '@/components/admin/kit/form/TextField'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { useDrawerParam, useUrlState } from '@/lib/admin/url-state'
import { MediaDetailDrawer } from './MediaDetailDrawer'
import { MediaTile } from './MediaTile'
import { isPrivateMedia, MEDIA_FOLDERS, mediaApi, mediaName, type MediaListFilters } from './mediaApi'
import { UploadDropzone } from './UploadDropzone'
import { UploadQueueList } from './UploadQueueList'
import { useUploadQueue } from './useUploadQueue'

const DEFAULTS = { q: '', type: '', folder: '', page: '1' }
export const MEDIA_PAGE_SIZE = 48

/** /admin/media — searchable, filterable thumbnail grid with multi-upload and a `?id=` detail drawer. */
export function MediaLibraryScreen() {
  const t = useTranslations('adminLibrary.media')
  const tf = useTranslations('adminLibrary.folders')
  const filters = useUrlState(DEFAULTS)
  const drawer = useDrawerParam('id')
  const confirm = useConfirm()
  const describe = useAdminErrorMessage()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const { q, type: rawType, folder, page: rawPage } = filters.values
  const type = rawType === 'image' || rawType === 'document' ? rawType : undefined
  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const query: MediaListFilters = { q, type, folder, page, pageSize: MEDIA_PAGE_SIZE }
  const list = useAdminQuery(['media', query], (signal) => mediaApi.list(query, signal))
  const items = list.data?.items.filter((m) => !isPrivateMedia(m))

  const folderOptions = MEDIA_FOLDERS.map((f) => ({ value: f, label: tf(f) }))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const stopSelecting = () => {
    setSelecting(false)
    setSelected(new Set())
  }

  /** Deletes the selected files one by one; files that are still used (409) are kept and listed. */
  const deleteSelected = async () => {
    const chosen = (items ?? []).filter((m) => selected.has(m.id))
    if (!chosen.length) return
    const used = chosen.filter((m) => m.usageCount > 0).length
    const ok = await confirm({
      title: t('bulk.deleteTitle', { count: chosen.length }),
      body: used
        ? t('bulk.deleteBodyUsed', { count: chosen.length, used })
        : t('bulk.deleteBody', { count: chosen.length }),
      confirmLabel: t('bulk.deleteConfirm', { count: chosen.length }),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    setDeleting(true)
    const kept: string[] = []
    const failed: string[] = []
    let deleted = 0
    for (const media of chosen) {
      try {
        await mediaApi.remove(media.id)
        deleted++
      } catch (error) {
        const err = toAdminApiError(error)
        if (err.code === 'MEDIA_IN_USE') kept.push(mediaName(media))
        else failed.push(`${mediaName(media)}: ${describe(err)}`)
      }
    }
    setDeleting(false)
    if (deleted) toast.success(t('bulk.deleted', { count: deleted }))
    if (kept.length) toast.warning(t('bulk.kept', { count: kept.length }), kept.slice(0, 6))
    if (failed.length) toast.error(t('bulk.failed', { count: failed.length }), failed.slice(0, 4))
    setSelected(new Set())
    invalidateAdminQueries('media')
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Button
              variant="ghost"
              icon={selecting ? 'close' : 'checklist'}
              aria-pressed={selecting}
              onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
            >
              {selecting ? t('bulk.done') : t('bulk.select')}
            </Button>
            <Button
              variant={uploadOpen ? 'secondary' : 'primary'}
              icon={uploadOpen ? 'close' : 'upload'}
              aria-expanded={uploadOpen}
              aria-controls="media-upload"
              onClick={() => setUploadOpen((v) => !v)}
            >
              {uploadOpen ? t('closeUpload') : t('upload')}
            </Button>
          </>
        }
      />

      {uploadOpen && <UploadPanel />}

      <div className="shadow-ambient flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-5">
        <FilterBar
          state={filters}
          fields={[
            { type: 'search', key: 'q', label: t('filters.search'), placeholder: t('filters.searchPlaceholder') },
            {
              type: 'select',
              key: 'type',
              label: t('filters.type'),
              allLabel: t('filters.allTypes'),
              options: [
                { value: 'image', label: t('filters.images') },
                { value: 'document', label: t('filters.documents') },
              ],
            },
            {
              type: 'select',
              key: 'folder',
              label: t('filters.folder'),
              allLabel: t('filters.allFolders'),
              options: folderOptions,
            },
          ]}
        />

        {selecting && (
          <div
            role="region"
            aria-label={t('bulk.label')}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary-fixed/20 px-3 py-2"
          >
            <span className="mr-auto font-body-md text-body-md font-semibold text-primary" aria-live="polite">
              {t('bulk.selected', { count: selected.size })}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set((items ?? []).map((m) => m.id)))}>
              {t('bulk.selectPage')}
            </Button>
            {selected.size > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                {t('bulk.clear')}
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              icon="delete"
              loading={deleting}
              disabled={selected.size === 0}
              onClick={() => void deleteSelected()}
            >
              {t('bulk.delete', { count: selected.size })}
            </Button>
          </div>
        )}

        {list.error && !list.data ? (
          <ErrorPanel error={list.error} onRetry={() => void list.refetch()} variant="inline" />
        ) : list.loading || !items ? (
          <LoadingPanel variant="cards" rows={12} card={false} />
        ) : items.length === 0 ? (
          filters.isDefault() ? (
            <EmptyPanel
              icon="perm_media"
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={
                <Button variant="primary" icon="upload" onClick={() => setUploadOpen(true)}>
                  {t('upload')}
                </Button>
              }
            />
          ) : (
            <EmptyPanel
              icon="filter_alt_off"
              title={t('noMatchesTitle')}
              body={t('noMatchesBody')}
              action={
                <Button icon="filter_alt_off" onClick={() => filters.reset()}>
                  {t('clearFilters')}
                </Button>
              }
            />
          )
        ) : (
          <ul
            id="media-results"
            aria-label={t('gridLabel')}
            aria-busy={list.fetching || undefined}
            className="grid grid-cols-2 gap-3 transition-opacity aria-busy:opacity-60 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
          >
            {items.map((media) => (
              <li key={media.id}>
                <MediaTile
                  media={media}
                  active={drawer.id === media.id}
                  onOpen={() => drawer.open(media.id)}
                  selection={
                    selecting ? { selected: selected.has(media.id), onToggle: () => toggle(media.id) } : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}

        {list.data && list.data.meta.total > 0 && (
          <AdminPagination
            page={list.data.meta.page}
            totalPages={list.data.meta.totalPages}
            total={list.data.meta.total}
            pageSize={list.data.meta.pageSize}
            onPageChange={(p) => filters.set({ page: String(p) })}
          />
        )}
      </div>

      <MediaDetailDrawer id={drawer.id} onClose={drawer.close} />
    </>
  )
}

/** Upload card: optional alt text + folder, drop zone, per-file progress and errors. */
function UploadPanel() {
  const t = useTranslations('adminLibrary.media')
  const tf = useTranslations('adminLibrary.folders')
  const [altText, setAltText] = useState('')
  const [folder, setFolder] = useState<string>('general')
  const queue = useUploadQueue({
    accept: 'any',
    folder,
    altText,
    onUploaded: () => invalidateAdminQueries('media'),
  })
  return (
    <Card
      id="media-upload"
      title={t('uploadTitle')}
      description={t('uploadDescription')}
      icon="cloud_upload"
      className="mb-4"
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <TextField
            label={t('altText')}
            hint={t('altTextHint')}
            value={altText}
            maxLength={300}
            onChange={(e) => setAltText(e.target.value)}
          />
          <SelectField
            label={t('folder')}
            hint={t('folderHint')}
            value={folder}
            onValueChange={(v) => setFolder(v || 'general')}
            options={MEDIA_FOLDERS.filter((f) => f !== 'seed').map((f) => ({ value: f, label: tf(f) }))}
          />
        </div>
        <UploadDropzone accept="any" onFiles={queue.add} />
        <UploadQueueList queue={queue} />
      </div>
    </Card>
  )
}

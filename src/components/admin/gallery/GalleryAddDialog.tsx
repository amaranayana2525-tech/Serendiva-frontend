'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { TextField } from '@/components/admin/kit/form/TextField'
import { MediaPicker } from '@/components/admin/kit/media/MediaPicker'
import { MediaThumb, toMediaRef } from '@/components/admin/kit/media/MediaThumb'
import { Modal } from '@/components/admin/kit/Modal'
import { useAdminMutation } from '@/lib/admin/hooks'
import type { AdminGalleryItem, AdminMedia } from '@/lib/api/types'
import { UploadDropzone } from '../media/UploadDropzone'
import { UploadQueueList } from '../media/UploadQueueList'
import { useUploadQueue } from '../media/useUploadQueue'
import { CategoryField } from './CategoryField'
import { galleryApi } from './galleryApi'
import { useGalleryCategoryLabel } from './useGalleryCategoryLabel'

export interface GalleryAddDialogProps {
  open: boolean
  onClose: () => void
  categories: readonly string[]
  /** Preselected category (the tab the user is on). */
  defaultCategory?: string
  onAdded: (items: AdminGalleryItem[]) => void
}

const MAX_BATCH = 50

/** "Add photos": upload many files (per-file progress/errors) and/or pick from the library → POST /gallery/bulk. */
export function GalleryAddDialog(props: GalleryAddDialogProps) {
  if (!props.open) return null
  return <AddDialog {...props} />
}

function AddDialog({ onClose, categories, defaultCategory, onAdded }: GalleryAddDialogProps) {
  const t = useTranslations('adminLibrary.gallery.add')
  const categoryLabel = useGalleryCategoryLabel()
  const confirm = useConfirm()
  const [category, setCategory] = useState(defaultCategory ?? '')
  const [location, setLocation] = useState('')
  const [altText, setAltText] = useState('')
  const [picked, setPicked] = useState<AdminMedia[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const queue = useUploadQueue({ accept: 'image', folder: 'gallery', altText })

  const pending = [...picked, ...queue.uploaded.filter((u) => !picked.some((p) => p.id === u.id))]
  const ready = pending.slice(0, MAX_BATCH)

  const create = useAdminMutation(
    () =>
      galleryApi.bulk({
        items: ready.map((m) => ({ mediaId: m.id, category, location: location.trim() || null })),
      }),
    {
      successToast: (items) => t('added', { count: items.length, category: categoryLabel(category) }),
      onError: (err) => setCategoryError(err.fieldErrors['items.0.category'] ?? null),
      onSuccess: (items) => {
        onAdded(items)
        onClose()
      },
      invalidate: ['gallery'],
    },
  )

  const submit = async () => {
    if (!category) {
      setCategoryError(t('categoryRequired'))
      return
    }
    await create.mutate()
  }

  const requestClose = async () => {
    if (queue.busy) {
      const ok = await confirm({
        title: t('cancelUploadsTitle'),
        body: t('cancelUploadsBody'),
        confirmLabel: t('cancelUploads'),
        tone: 'danger',
      })
      if (!ok) return
    } else if (pending.length > 0) {
      const ok = await confirm({
        title: t('discardTitle'),
        body: t('discardBody', { count: pending.length }),
        confirmLabel: t('discard'),
        tone: 'danger',
      })
      if (!ok) return
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={() => void requestClose()}
      dismissible={false}
      size="lg"
      icon="add_photo_alternate"
      title={t('title')}
      description={t('description')}
      bodyClassName="flex flex-col gap-4"
      footer={
        <>
          <span className="mr-auto font-body-md text-body-md text-on-surface-variant" aria-live="polite">
            {queue.busy ? t('waiting') : t('readyCount', { count: ready.length })}
          </span>
          <Button variant="ghost" onClick={() => void requestClose()}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            icon="check"
            loading={create.pending}
            disabled={ready.length === 0 || queue.busy}
            onClick={() => void submit()}
          >
            {category
              ? t('submit', { count: ready.length, category: categoryLabel(category) })
              : t('submitNoCategory', { count: ready.length })}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <CategoryField
          value={category}
          onChange={(v) => {
            setCategory(v)
            setCategoryError(null)
          }}
          categories={categories}
          error={categoryError}
          required
        />
        <TextField
          label={t('location')}
          hint={t('locationHint')}
          value={location}
          maxLength={160}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <TextField
        label={t('altText')}
        hint={t('altTextHint')}
        value={altText}
        maxLength={300}
        onChange={(e) => setAltText(e.target.value)}
      />

      <UploadDropzone accept="image" onFiles={queue.add} compact />
      <div className="flex flex-wrap items-center justify-center gap-2 font-body-md text-body-md text-on-surface-variant">
        <span>{t('orLibrary')}</span>
        <Button size="sm" icon="photo_library" onClick={() => setPickerOpen(true)}>
          {t('fromLibrary')}
        </Button>
      </div>

      <UploadQueueList queue={queue} />

      {picked.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-body-md text-[13px] font-semibold text-on-surface">
            {t('pickedTitle', { count: picked.length })}
          </p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label={t('pickedTitle', { count: picked.length })}>
            {picked.map((m) => (
              <li key={m.id} className="relative aspect-square overflow-hidden rounded-lg bg-surface-container">
                <MediaThumb media={toMediaRef(m)} sizes="120px" />
                <IconButton
                  icon="close"
                  size="sm"
                  variant="secondary"
                  label={t('removePicked', { name: m.originalName ?? m.altText.en ?? m.id })}
                  onClick={() => setPicked((list) => list.filter((p) => p.id !== m.id))}
                  className="absolute right-1 top-1 h-7 w-7"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      {pending.length > MAX_BATCH && (
        <p className="font-caption text-caption text-secondary">{t('tooMany', { max: MAX_BATCH })}</p>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple
        max={MAX_BATCH}
        folder="gallery"
        title={t('pickerTitle')}
        onSelect={(media) => setPicked((list) => [...list, ...media.filter((m) => !list.some((p) => p.id === m.id))])}
      />
    </Modal>
  )
}

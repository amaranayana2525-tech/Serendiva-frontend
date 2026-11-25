'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Drawer } from '@/components/admin/kit/Drawer'
import { Switch } from '@/components/admin/kit/form/Switch'
import { TextField } from '@/components/admin/kit/form/TextField'
import { LocaleTabs, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { Icon } from '@/components/ui/Icon'
import { useAdminMutation } from '@/lib/admin/hooks'
import { ADMIN_LOCALES, localeErrors, localeFromPath, type AdminLocale } from '@/lib/admin/translatable'
import { confirmDiscardChanges, useUnsavedChanges } from '@/lib/admin/unsaved'
import type { AdminGalleryItem, AdminMediaRef } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { CategoryField } from './CategoryField'
import {
  fromCaptionEdit,
  galleryApi,
  galleryItemLabel,
  toCaptionEdit,
  type CaptionEdit,
  type GalleryType,
} from './galleryApi'

export interface GalleryItemDrawerProps {
  /** Item id, 'new' (create a video/photo) or null (closed). */
  id: string | null
  items: readonly AdminGalleryItem[]
  categories: readonly string[]
  /** Category preselected for new items. */
  defaultCategory?: string
  /** True while the list is still loading (an id from the URL can't be resolved yet). */
  loading: boolean
  onClose: () => void
  onSaved: (item: AdminGalleryItem, created: boolean) => void
  onDelete: (item: AdminGalleryItem) => void
}

interface FormState {
  type: GalleryType
  media: AdminMediaRef | null
  videoUrl: string
  category: string
  caption: CaptionEdit
  location: string
  published: boolean
}

function toForm(item: AdminGalleryItem | null, defaultCategory = ''): FormState {
  return {
    type: item?.type ?? 'video',
    media: item?.media ?? null,
    videoUrl: item?.videoUrl ?? '',
    category: item?.category ?? defaultCategory,
    caption: toCaptionEdit(item?.caption ?? null),
    location: item?.location ?? '',
    published: (item?.status ?? 'published') === 'published',
  }
}

/** Edit drawer (`?item=<id>`, `?item=new`): type, image/poster, video URL, category, caption per locale, location, visibility. */
export function GalleryItemDrawer({
  id,
  items,
  categories,
  defaultCategory,
  loading,
  onClose,
  onSaved,
  onDelete,
}: GalleryItemDrawerProps) {
  const t = useTranslations('adminLibrary.gallery')
  const isNew = id === 'new'
  const item = id && !isNew ? (items.find((g) => g.id === id) ?? null) : null
  const close = async () => {
    if (await confirmDiscardChanges()) onClose()
  }
  const missing = id !== null && !isNew && !item && !loading
  return (
    <Drawer
      open={id !== null}
      onClose={() => void close()}
      title={isNew ? t('drawer.newTitle') : item ? galleryItemLabel(item) || t('untitled') : t('drawer.editTitle')}
      subtitle={item ? t(`drawer.subtitle.${item.type}`) : undefined}
      size="lg"
    >
      {missing ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Icon name="search_off" className="text-[32px] text-outline" />
          <p className="font-body-lg text-body-lg font-semibold text-primary">{t('drawer.notFoundTitle')}</p>
          <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">{t('drawer.notFoundBody')}</p>
          <Button className="mt-2" onClick={onClose}>
            {t('drawer.close')}
          </Button>
        </div>
      ) : isNew || item ? (
        <GalleryItemForm
          key={item?.id ?? 'new'}
          item={item}
          items={items}
          categories={categories}
          defaultCategory={defaultCategory}
          onCancel={() => void close()}
          onSaved={onSaved}
          onDelete={onDelete}
        />
      ) : null}
    </Drawer>
  )
}

function GalleryItemForm({
  item,
  items,
  categories,
  defaultCategory,
  onCancel,
  onSaved,
  onDelete,
}: {
  item: AdminGalleryItem | null
  items: readonly AdminGalleryItem[]
  categories: readonly string[]
  defaultCategory?: string
  onCancel: () => void
  onSaved: (item: AdminGalleryItem, created: boolean) => void
  onDelete: (item: AdminGalleryItem) => void
}) {
  const t = useTranslations('adminLibrary.gallery')
  const [form, setForm] = useState<FormState>(() => toForm(item, defaultCategory))
  const [baseline, setBaseline] = useState(() => JSON.stringify(toForm(item, defaultCategory)))
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusTick, setFocusTick] = useState(0)
  const dirty = JSON.stringify(form) !== baseline

  const save = useAdminMutation(
    async () => {
      const body = {
        type: form.type,
        mediaId: form.media?.id ?? null,
        videoUrl: form.type === 'video' ? form.videoUrl.trim() || null : null,
        category: form.category,
        caption: fromCaptionEdit(form.caption),
        location: form.location.trim() || null,
        order: item ? item.order : items.reduce((max, g) => Math.max(max, g.order + 1), 0),
        status: form.published ? ('published' as const) : ('draft' as const),
      }
      return item ? galleryApi.update(item.id, body) : galleryApi.create(body)
    },
    {
      successToast: item ? t('drawer.saved') : t('drawer.created'),
      invalidate: ['gallery'],
      onError: (err) => {
        setErrors(err.fieldErrors)
        const first = Object.keys(err.fieldErrors)[0]
        const loc = first ? localeFromPath(first) : undefined
        if (loc) setLocale(loc)
        setFocusTick((n) => n + 1)
      },
      onSuccess: (saved) => {
        setErrors({})
        const next = toForm(saved)
        setForm(next)
        setBaseline(JSON.stringify(next))
        onSaved(saved, !item)
      },
    },
  )
  useUnsavedChanges(dirty && !save.pending)

  // Focus the first invalid control after a failed save.
  useEffect(() => {
    if (!focusTick) return
    document.querySelector<HTMLElement>('#gallery-item-form [aria-invalid="true"]')?.focus()
  }, [focusTick])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key === 'media' ? 'mediaId' : key])
      setErrors(({ [key === 'media' ? 'mediaId' : key]: _drop, ...rest }) => rest)
  }
  const setCaption = (field: keyof CaptionEdit, value: Record<AdminLocale, string>) =>
    setForm((f) => ({ ...f, caption: { ...f.caption, [field]: value } }))

  const titleErrors = localeErrors(
    Object.fromEntries(
      Object.entries(errors).flatMap(([p, m]) =>
        /^caption\.\w+\.title/.test(p) ? [[p.replace('.title', ''), m]] : [],
      ),
    ),
    'caption',
  )
  const captionErrors = localeErrors(
    Object.fromEntries(
      Object.entries(errors).flatMap(([p, m]) =>
        /^caption\.\w+\.caption/.test(p) ? [[p.replace(/\.caption$/, ''), m]] : [],
      ),
    ),
    'caption',
  )
  const filled = Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, Boolean(form.caption.title[l].trim() || form.caption.caption[l].trim())]),
  ) as Record<AdminLocale, boolean>
  const errorLocales = Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, Boolean(titleErrors[l] || captionErrors[l])]),
  ) as Record<AdminLocale, boolean>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void save.mutate()
  }

  return (
    <form id="gallery-item-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 font-body-md text-[13px] font-semibold text-on-surface">{t('fields.type')}</legend>
        <div className="inline-flex gap-1 self-start rounded-xl bg-surface-container p-1">
          {(['image', 'video'] as const).map((type) => (
            <label
              key={type}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-body-md text-[13px] font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                form.type === type
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary',
              )}
            >
              <input
                type="radio"
                name="gallery-type"
                value={type}
                checked={form.type === type}
                onChange={() => set('type', type)}
                className="sr-only"
              />
              <Icon name={type === 'image' ? 'image' : 'videocam'} className="text-[18px]" />
              {t(`fields.types.${type}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <ImageField
        label={form.type === 'video' ? t('fields.poster') : t('fields.photo')}
        hint={form.type === 'video' ? t('fields.posterHint') : undefined}
        value={form.media}
        onChange={(media) => set('media', media)}
        required={form.type === 'image'}
        error={errors.mediaId}
        folder="gallery"
      />

      {form.type === 'video' && (
        <TextField
          label={t('fields.videoUrl')}
          hint={t('fields.videoUrlHint')}
          type="url"
          inputMode="url"
          required
          value={form.videoUrl}
          maxLength={500}
          error={errors.videoUrl}
          placeholder={t('fields.videoUrlPlaceholder')}
          onChange={(e) => set('videoUrl', e.target.value)}
        />
      )}

      <CategoryField
        value={form.category}
        onChange={(v) => set('category', v)}
        categories={categories}
        error={errors.category}
        required
      />

      <div className="flex flex-col gap-3 rounded-xl border border-surface-container-high p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body-md text-[13px] font-semibold text-on-surface">{t('fields.captionGroup')}</p>
          <LocaleTabs value={locale} onChange={setLocale} filled={filled} errors={errorLocales} size="sm" />
        </div>
        <TranslatableText
          label={t('fields.title')}
          locale={locale}
          value={form.caption.title}
          maxLength={120}
          counter
          error={titleErrors}
          onChange={(v) => setCaption('title', { ...form.caption.title, ...v } as Record<AdminLocale, string>)}
        />
        <TranslatableText
          label={t('fields.caption')}
          locale={locale}
          multiline={3}
          value={form.caption.caption}
          maxLength={200}
          counter
          error={captionErrors}
          onChange={(v) => setCaption('caption', { ...form.caption.caption, ...v } as Record<AdminLocale, string>)}
        />
      </div>

      <TextField
        label={t('fields.location')}
        icon="location_on"
        value={form.location}
        maxLength={160}
        error={errors.location}
        placeholder={t('fields.locationPlaceholder')}
        onChange={(e) => set('location', e.target.value)}
      />

      <Switch
        checked={form.published}
        onCheckedChange={(v) => set('published', v)}
        label={t('fields.published')}
        description={t('fields.publishedHint')}
      />

      <div className="sticky -bottom-4 z-10 -mx-4 -mb-4 flex flex-wrap items-center gap-2 border-t border-surface-container-high bg-surface-container-lowest px-4 py-3 md:-bottom-5 md:-mx-6 md:-mb-5 md:px-6">
        {item && (
          <Button variant="dangerGhost" icon="delete" onClick={() => onDelete(item)}>
            {t('drawer.delete')}
          </Button>
        )}
        <span className="ml-auto" />
        {dirty && <span className="font-caption text-caption text-secondary">{t('drawer.unsaved')}</span>}
        <Button variant="ghost" onClick={onCancel}>
          {t('drawer.cancel')}
        </Button>
        <Button type="submit" variant="primary" icon="check" loading={save.pending} disabled={!dirty && Boolean(item)}>
          {item ? t('drawer.save') : t('drawer.create')}
        </Button>
      </div>
    </form>
  )
}

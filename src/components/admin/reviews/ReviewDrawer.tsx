'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { Drawer } from '@/components/admin/kit/Drawer'
import { DateField } from '@/components/admin/kit/form/DateField'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { Switch } from '@/components/admin/kit/form/Switch'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import { GalleryField, type GalleryFieldItem } from '@/components/admin/kit/media/GalleryField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { countryOptions } from '@/components/reviews/countries'
import { Icon } from '@/components/ui/Icon'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { confirmDiscardChanges, skipUnsavedCheck, useUnsavedChanges } from '@/lib/admin/unsaved'
import { nestedDialogGuard } from '../destinations/lib/nestedDialogs'
import type { AdminMediaRef, AdminReview, ReviewSource, TravellerType } from '@/lib/api/types'
import { flagEmoji } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  REVIEW_LOCALES,
  REVIEW_SOURCES,
  REVIEW_STATUSES,
  reviewsApi,
  tourOptionsApi,
  TRAVELLER_TYPES,
  type ReviewBody,
  type ReviewStatus,
} from './api'
import { RatingInput } from './Rating'
import { useReviewFormat } from './useReviewFormat'

type ReviewLocale = (typeof REVIEW_LOCALES)[number]

interface ReviewForm {
  guestName: string
  email: string
  country: string
  location: string
  partyLabel: string
  travellerType: TravellerType
  tourType: string
  tripLabel: string
  tourId: string
  rating: number
  title: string
  text: string
  photo: AdminMediaRef | null
  tripPhotos: GalleryFieldItem[]
  source: ReviewSource
  travelDate: string
  status: ReviewStatus
  isFeatured: boolean
  locale: ReviewLocale
}

const LIMITS = {
  guestName: 120,
  email: 200,
  location: 120,
  partyLabel: 60,
  tourType: 80,
  tripLabel: 120,
  title: 200,
  text: 5000,
  tripPhotos: 12,
} as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toForm(r: AdminReview | null): ReviewForm {
  return {
    guestName: r?.guestName ?? '',
    email: r?.email ?? '',
    country: r?.country ?? '',
    location: r?.location ?? '',
    partyLabel: r?.partyLabel ?? '',
    travellerType: r?.travellerType ?? 'couple',
    tourType: r?.tourType ?? '',
    tripLabel: r?.tripLabel ?? '',
    tourId: r?.tourId ?? '',
    rating: r?.rating ?? 5,
    title: r?.title ?? '',
    text: r?.text ?? '',
    photo: r?.photo ?? null,
    tripPhotos: (r?.tripPhotos ?? []).map((media) => ({ mediaId: media.id, media, caption: null })),
    source: r?.source ?? 'tripadvisor',
    travelDate: r?.travelDate ?? '',
    status: r?.status ?? 'approved',
    isFeatured: r?.isFeatured ?? false,
    locale: (REVIEW_LOCALES as readonly string[]).includes(r?.locale ?? '') ? (r?.locale as ReviewLocale) : 'en',
  }
}

const orNull = (v: string) => (v.trim() ? v.trim() : null)

function toWrite(f: ReviewForm): ReviewBody {
  return {
    guestName: f.guestName.trim(),
    email: orNull(f.email),
    country: f.country,
    location: orNull(f.location),
    partyLabel: orNull(f.partyLabel),
    travellerType: f.travellerType,
    tourType: orNull(f.tourType),
    tripLabel: orNull(f.tripLabel),
    tourId: f.tourId || null,
    rating: f.rating,
    title: orNull(f.title),
    text: f.text.trim(),
    photoId: f.photo?.id ?? null,
    tripPhotoIds: f.tripPhotos.map((p) => p.mediaId),
    source: f.source,
    travelDate: f.travelDate || null,
    status: f.status,
    isFeatured: f.isFeatured,
    locale: f.locale,
  }
}

export interface ReviewDrawerProps {
  /** 'new', a review id, or null (closed). */
  id: string | null
  onClose: () => void
}

/** Edit / add a review in a side drawer (guest, trip, review text, photos, moderation). */
export function ReviewDrawer({ id, onClose }: ReviewDrawerProps) {
  const t = useTranslations('adminContent.reviews.form')
  const isNew = id === 'new'
  const detail = useAdminQuery(['review', id ?? ''], (signal) => reviewsApi.get(id ?? '', signal), [], {
    enabled: id !== null && !isNew,
    keepPreviousData: false,
  })
  const review = id && !isNew ? detail.data : undefined
  const close = async () => {
    if (await confirmDiscardChanges()) onClose()
  }
  return (
    <Drawer
      open={id !== null}
      onClose={() => void close()}
      size="xl"
      title={isNew ? t('newTitle') : (review?.guestName ?? t('editTitle'))}
      meta={review ? <StatusBadge kind="review" status={review.status} size="md" /> : undefined}
      subtitle={isNew ? t('newSubtitle') : undefined}
    >
      {id === null ? null : isNew ? (
        <ReviewFormView key="new" review={null} onDone={onClose} />
      ) : review ? (
        <ReviewFormView key={review.id} review={review} onDone={onClose} />
      ) : detail.error ? (
        detail.error.isNotFound ? (
          <EmptyPanel icon="search_off" title={t('notFoundTitle')} body={t('notFoundBody')} />
        ) : (
          <ErrorPanel error={detail.error} onRetry={() => void detail.refetch()} variant="inline" />
        )
      ) : (
        <LoadingPanel variant="form" rows={8} card={false} />
      )}
    </Drawer>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 font-body-md text-body-md font-semibold text-primary">
        <Icon name={icon} className="text-[18px] text-secondary" />
        {title}
      </h3>
      {children}
    </section>
  )
}

function ReviewFormView({ review, onDone }: { review: AdminReview | null; onDone: () => void }) {
  const t = useTranslations('adminContent.reviews.form')
  const tr = useTranslations('adminContent.reviews')
  const tc = useTranslations('adminContent.common')
  const ts = useTranslations('admin.status.review')
  const tl = useTranslations('admin.kit.locales')
  const fmt = useReviewFormat()
  const confirm = useConfirm()
  const describe = useAdminErrorMessage()
  const [initial] = useState(() => toForm(review))
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
  useUnsavedChanges(dirty && !saving && !deleting)

  const tours = useAdminQuery(['tour-options'], (signal) => tourOptionsApi.list(signal))
  const countries = useMemo(() => {
    const list = countryOptions('en').map((c) => ({ value: c.value, label: `${flagEmoji(c.value)} ${c.label}` }))
    // Keep a stored code that isn't in the ISO list (legacy data) selectable instead of silently blanking it.
    const stored = initial.country
    return stored && !list.some((c) => c.value === stored) ? [{ value: stored, label: stored }, ...list] : list
  }, [initial.country])

  const set = <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    const errorKey = key === 'photo' ? 'photoId' : key === 'tripPhotos' ? 'tripPhotoIds' : key
    if (Object.keys(errors).some((p) => p === errorKey || p.startsWith(`${errorKey}.`))) {
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([p]) => p !== errorKey && !p.startsWith(`${errorKey}.`))))
    }
  }

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs)
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('dialog[open] [aria-invalid="true"]')
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el?.focus({ preventScroll: true })
    })
  }

  const save = async () => {
    const errs: Record<string, string> = {}
    if (!form.guestName.trim()) errs.guestName = t('errors.required')
    if (!form.country) errs.country = t('errors.country')
    if (!form.text.trim()) errs.text = t('errors.required')
    if (form.email.trim() && !EMAIL.test(form.email.trim())) errs.email = t('errors.email')
    if (form.rating < 1 || form.rating > 5) errs.rating = t('errors.rating')
    if (Object.keys(errs).length) {
      showErrors(errs)
      toast.error(tc('fixErrors'))
      return
    }
    setSaving(true)
    try {
      const body = toWrite(form)
      const saved = review ? await reviewsApi.update(review.id, body) : await reviewsApi.create(body)
      toast.success(review ? t('savedToast', { name: saved.guestName }) : t('createdToast', { name: saved.guestName }))
      invalidateAdminQueries(['reviews', 'review', 'stats', 'dashboard'])
      skipUnsavedCheck()
      onDone()
    } catch (raw) {
      const error = toAdminApiError(raw)
      if (error.isValidationError) showErrors(error.fieldErrors)
      toast.error(describe(error), error.issues.slice(0, 4).map((i) => `${i.path}: ${i.message}`))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!review) return
    const ok = await confirm({
      title: t('deleteTitle', { name: review.guestName }),
      body: t('deleteBody'),
      confirmLabel: t('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    setDeleting(true)
    try {
      await reviewsApi.remove(review.id)
      toast.success(t('deletedToast', { name: review.guestName }))
      invalidateAdminQueries(['reviews', 'stats', 'dashboard'])
      skipUnsavedCheck()
      onDone()
    } catch (raw) {
      toast.error(describe(raw))
      setDeleting(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      {...nestedDialogGuard}
      className="flex min-h-full flex-col gap-6"
    >
      {review && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-surface-container-low px-3 py-2 font-caption text-caption text-on-surface-variant">
          <Icon name="schedule" className="text-[14px]" />
          {t('received', { date: fmt.date(review.createdAt) })}
          {review.approvedAt && <span>· {t('approvedAt', { date: fmt.date(review.approvedAt) })}</span>}
          <span>· {tl(`${initial.locale}.name`)}</span>
        </p>
      )}

      <Section title={t('sections.moderation')} icon="flag">
        <div role="radiogroup" aria-label={t('fields.status')} className="grid grid-cols-3 gap-1 rounded-xl bg-surface-container p-1">
          {REVIEW_STATUSES.map((s) => {
            const active = form.status === s
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set('status', s)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-body-md text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  active ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary',
                )}
              >
                {active && <Icon name="check" className="text-[16px]" />}
                {ts(s)}
              </button>
            )
          })}
        </div>
        <Switch
          checked={form.isFeatured}
          onCheckedChange={(v) => set('isFeatured', v)}
          label={t('fields.featured')}
          description={t('hints.featured')}
        />
      </Section>

      <Section title={t('sections.guest')} icon="person">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label={t('fields.guestName')}
            required
            value={form.guestName}
            maxLength={LIMITS.guestName}
            onChange={(e) => set('guestName', e.target.value)}
            error={errors.guestName}
            autoComplete="off"
          />
          <TextField
            label={t('fields.email')}
            type="email"
            value={form.email}
            maxLength={LIMITS.email}
            onChange={(e) => set('email', e.target.value)}
            hint={t('hints.email')}
            error={errors.email}
            autoComplete="off"
          />
          <SelectField
            label={t('fields.country')}
            required
            value={form.country}
            onValueChange={(v) => set('country', v)}
            options={countries}
            placeholder={t('placeholders.country')}
            error={errors.country}
          />
          <TextField
            label={t('fields.location')}
            value={form.location}
            maxLength={LIMITS.location}
            placeholder={t('placeholders.location')}
            onChange={(e) => set('location', e.target.value)}
            error={errors.location}
          />
          <SelectField
            label={t('fields.travellerType')}
            required
            value={form.travellerType}
            onValueChange={(v) => v && set('travellerType', v)}
            options={TRAVELLER_TYPES.map((v) => ({ value: v, label: tr(`travellerTypes.${v}`) }))}
            error={errors.travellerType}
          />
          <TextField
            label={t('fields.partyLabel')}
            value={form.partyLabel}
            maxLength={LIMITS.partyLabel}
            placeholder={t('placeholders.partyLabel')}
            onChange={(e) => set('partyLabel', e.target.value)}
            error={errors.partyLabel}
          />
        </div>
      </Section>

      <Section title={t('sections.trip')} icon="map">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label={t('fields.tour')}
            value={form.tourId}
            onValueChange={(v) => set('tourId', v)}
            options={tours.data ?? []}
            placeholder={tours.loading ? t('placeholders.loadingTours') : t('placeholders.noTour')}
            hint={t('hints.tour')}
            error={errors.tourId}
          />
          <DateField
            label={t('fields.travelDate')}
            type="month"
            value={form.travelDate}
            onChange={(v) => set('travelDate', v)}
            error={errors.travelDate}
          />
          <TextField
            label={t('fields.tourType')}
            value={form.tourType}
            maxLength={LIMITS.tourType}
            placeholder={t('placeholders.tourType')}
            onChange={(e) => set('tourType', e.target.value)}
            error={errors.tourType}
          />
          <TextField
            label={t('fields.tripLabel')}
            value={form.tripLabel}
            maxLength={LIMITS.tripLabel}
            placeholder={t('placeholders.tripLabel')}
            onChange={(e) => set('tripLabel', e.target.value)}
            error={errors.tripLabel}
          />
          <SelectField
            label={t('fields.source')}
            value={form.source}
            onValueChange={(v) => v && set('source', v)}
            options={REVIEW_SOURCES.map((v) => ({ value: v, label: tr(`sources.${v}`) }))}
            hint={t('hints.source')}
            error={errors.source}
          />
          <SelectField
            label={t('fields.locale')}
            value={form.locale}
            onValueChange={(v) => v && set('locale', v)}
            options={REVIEW_LOCALES.map((v) => ({ value: v, label: tl(`${v}.name`) }))}
            hint={t('hints.locale')}
            error={errors.locale}
          />
        </div>
      </Section>

      <Section title={t('sections.review')} icon="rate_review">
        <RatingInput label={t('fields.rating')} required value={form.rating} onChange={(v) => set('rating', v)} error={errors.rating} />
        <TextField
          label={t('fields.title')}
          value={form.title}
          maxLength={LIMITS.title}
          placeholder={t('placeholders.title')}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
        />
        <TextArea
          label={t('fields.text')}
          required
          rows={7}
          value={form.text}
          maxLength={LIMITS.text}
          counter
          onChange={(e) => set('text', e.target.value)}
          error={errors.text}
          lang={form.locale}
        />
      </Section>

      <Section title={t('sections.photos')} icon="photo_camera">
        <ImageField
          label={t('fields.photo')}
          value={form.photo}
          onChange={(photo) => set('photo', photo)}
          aspect="square"
          folder="reviews"
          hint={t('hints.photo')}
          error={errors.photoId}
        />
        <GalleryField
          label={t('fields.tripPhotos')}
          value={form.tripPhotos}
          onChange={(items) => set('tripPhotos', items)}
          captions={false}
          max={LIMITS.tripPhotos}
          folder="reviews"
          hint={t('hints.tripPhotos')}
          error={errors.tripPhotoIds ?? Object.entries(errors).find(([p]) => p.startsWith('tripPhotoIds.'))?.[1]}
        />
      </Section>

      <div className="sticky -bottom-4 z-10 -mx-4 -mb-4 mt-auto md:-bottom-5 flex flex-wrap items-center gap-2 border-t border-surface-container-high bg-surface-container-lowest px-4 py-3 md:-mx-6 md:-mb-5 md:px-6">
        {review && (
          <Button variant="dangerGhost" icon="delete" onClick={() => void onDelete()} loading={deleting}>
            {t('delete')}
          </Button>
        )}
        <span className="ml-auto" />
        {dirty && <span className="font-caption text-caption text-secondary">{t('unsaved')}</span>}
        <Button variant="ghost" onClick={() => void confirmDiscardChanges().then((ok) => ok && onDone())}>
          {tc('cancel')}
        </Button>
        <Button type="submit" variant="primary" icon="save" loading={saving} disabled={!dirty && review !== null}>
          {review ? t('save') : t('create')}
        </Button>
      </div>
    </form>
  )
}

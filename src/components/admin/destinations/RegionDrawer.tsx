'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Drawer } from '@/components/admin/kit/Drawer'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { localeErrors, LocaleTabs, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { SlugField, SLUG_PATTERN } from '@/components/admin/kit/form/SlugField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { EmptyPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import {
  compactOptional,
  compactRequired,
  localeFromPath,
  localesWithContent,
  toEditable,
  type AdminLocale,
} from '@/lib/admin/translatable'
import { confirmDiscardChanges, skipUnsavedCheck, useUnsavedChanges } from '@/lib/admin/unsaved'
import { nestedDialogGuard } from './lib/nestedDialogs'
import type { AdminMediaRef, AdminRegion, MonthRating } from '@/lib/api/types'
import { regionsApi } from './lib/api'
import type { FieldErrors } from './lib/destinationForm'
import { BestMonthsEditor, MONTH_RATINGS } from './ui/BestMonthsEditor'

interface RegionFormState {
  slug: string
  name: Record<AdminLocale, string>
  description: Record<AdminLocale, string>
  places: Record<AdminLocale, string>
  icon: string | null
  bestMonths: MonthRating[]
  image: AdminMediaRef | null
}

const isRating = (v: string): v is MonthRating => (MONTH_RATINGS as readonly string[]).includes(v)

function toState(region: AdminRegion | null): RegionFormState {
  return {
    slug: region?.slug ?? '',
    name: toEditable(region?.name),
    description: toEditable(region?.description),
    places: toEditable(region?.places),
    icon: region?.icon ?? null,
    bestMonths: (region?.bestMonths ?? []).filter(isRating),
    image: region?.image ?? null,
  }
}

const LIMITS = { name: 120, description: 800, places: 300 } as const

export interface RegionDrawerProps {
  /** 'new', a region id, or null (closed). */
  id: string | null
  regions: AdminRegion[] | undefined
  onClose: () => void
}

/** Create / edit a region in a side drawer (name, slug, description, places, icon, image, best months). */
export function RegionDrawer({ id, regions, onClose }: RegionDrawerProps) {
  const t = useTranslations('adminContent.regions')
  const isNew = id === 'new'
  const region = id && !isNew ? regions?.find((r) => r.id === id) : undefined
  const close = async () => {
    if (await confirmDiscardChanges()) onClose()
  }
  return (
    <Drawer
      open={id !== null}
      onClose={() => void close()}
      title={isNew ? t('newTitle') : (region?.name.en ?? t('editTitle'))}
      subtitle={isNew ? t('newSubtitle') : region ? t('editSubtitle', { count: region.destinationCount }) : undefined}
      size="lg"
    >
      {id === null ? null : isNew ? (
        <RegionForm key="new" region={null} order={regions?.length ?? 0} onDone={onClose} />
      ) : region ? (
        <RegionForm key={region.id} region={region} order={region.order} onDone={onClose} />
      ) : regions ? (
        <EmptyPanel icon="search_off" title={t('notFoundTitle')} body={t('notFoundBody')} />
      ) : (
        <LoadingPanel variant="form" rows={6} card={false} />
      )}
    </Drawer>
  )
}

function RegionForm({ region, order, onDone }: { region: AdminRegion | null; order: number; onDone: () => void }) {
  const t = useTranslations('adminContent.regions')
  const tc = useTranslations('adminContent.common')
  const te = useTranslations('adminContent.editor')
  const describe = useAdminErrorMessage()
  const [initial] = useState(() => toState(region))
  const [form, setForm] = useState(initial)
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
  useUnsavedChanges(dirty && !saving)

  const set = <K extends keyof RegionFormState>(key: K, value: RegionFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key] || Object.keys(errors).some((p) => p.startsWith(`${key}.`))) {
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([p]) => p !== key && !p.startsWith(`${key}.`))))
    }
  }

  const showErrors = (errs: FieldErrors) => {
    setErrors(errs)
    const first = Object.keys(errs)[0]
    const l = first ? localeFromPath(first) : undefined
    if (l) setLocale(l)
    requestAnimationFrame(() => document.querySelector<HTMLElement>('dialog[open] [aria-invalid="true"]')?.focus())
  }

  const save = async () => {
    const errs: FieldErrors = {}
    if (!form.name.en.trim()) errs['name.en'] = te('errors.required')
    if (!form.slug.trim()) errs.slug = te('errors.required')
    else if (!SLUG_PATTERN.test(form.slug) || form.slug.length < 2) errs.slug = te('errors.slug')
    if (Object.keys(errs).length) {
      showErrors(errs)
      return
    }
    setSaving(true)
    const body = {
      slug: form.slug,
      name: compactRequired(form.name, ''),
      description: compactOptional(form.description),
      places: compactOptional(form.places),
      icon: form.icon,
      bestMonths: form.bestMonths,
      imageId: form.image?.id ?? null,
      order,
    }
    try {
      const saved = region ? await regionsApi.update(region.id, body) : await regionsApi.create(body)
      toast.success(region ? t('savedToast', { name: saved.name.en ?? saved.slug }) : t('createdToast', { name: saved.name.en ?? saved.slug }))
      invalidateAdminQueries(['regions', 'destinations', 'region-options'])
      skipUnsavedCheck()
      onDone()
    } catch (raw) {
      const error = toAdminApiError(raw)
      const fieldErrors = error.isConflict ? { slug: error.message || te('errors.slugTaken') } : error.fieldErrors
      if (Object.keys(fieldErrors).length) showErrors(fieldErrors)
      toast.error(error.isConflict ? te('errors.slugTaken') : describe(error))
    } finally {
      setSaving(false)
    }
  }

  const filled = localesWithContent(form.name, form.description, form.places)
  const localeErrorFlags = Object.fromEntries(
    Object.keys(errors)
      .map((p) => localeFromPath(p))
      .filter((l): l is AdminLocale => Boolean(l))
      .map((l) => [l, true]),
  )

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      {...nestedDialogGuard}
      className="flex min-h-full flex-col gap-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-body-md text-[13px] font-semibold text-on-surface">{tc('contentLanguage')}</p>
        <LocaleTabs value={locale} onChange={setLocale} filled={filled} errors={localeErrorFlags} />
      </div>
      <TranslatableText
        label={t('fields.name')}
        required
        value={form.name}
        onChange={(v) => set('name', { ...form.name, ...v })}
        locale={locale}
        maxLength={LIMITS.name}
        counter
        error={localeErrors(errors, 'name')}
      />
      <SlugField value={form.slug} onChange={(slug) => set('slug', slug)} source={form.name.en} required error={errors.slug} hint={undefined} />
      <TranslatableText
        label={t('fields.description')}
        value={form.description}
        onChange={(v) => set('description', { ...form.description, ...v })}
        locale={locale}
        multiline={3}
        maxLength={LIMITS.description}
        counter
        hint={t('hints.description')}
        error={localeErrors(errors, 'description')}
      />
      <TranslatableText
        label={t('fields.places')}
        value={form.places}
        onChange={(v) => set('places', { ...form.places, ...v })}
        locale={locale}
        maxLength={LIMITS.places}
        hint={t('hints.places')}
        error={localeErrors(errors, 'places')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <IconPicker label={t('fields.icon')} value={form.icon} onChange={(icon) => set('icon', icon)} error={errors.icon} />
      </div>
      <ImageField
        label={t('fields.image')}
        value={form.image}
        onChange={(image) => set('image', image)}
        folder="destinations"
        hint={t('hints.image')}
        error={errors.imageId}
      />
      <BestMonthsEditor value={form.bestMonths} onChange={(v) => set('bestMonths', v)} error={errors.bestMonths} />

      <div className="sticky -bottom-4 z-10 -mx-4 -mb-4 mt-auto md:-bottom-5 flex flex-wrap items-center justify-end gap-2 border-t border-surface-container-high bg-surface-container-lowest px-4 py-3 md:-mx-6 md:-mb-5 md:px-6">
        {dirty && <span className="mr-auto font-caption text-caption text-secondary">{te('unsaved')}</span>}
        <Button variant="ghost" onClick={() => void confirmDiscardChanges().then((ok) => ok && onDone())}>
          {tc('cancel')}
        </Button>
        <Button type="submit" variant="primary" icon="save" loading={saving} disabled={!dirty && region !== null}>
          {region ? te('save') : t('create')}
        </Button>
      </div>
    </form>
  )
}

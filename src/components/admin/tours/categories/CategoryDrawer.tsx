'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Drawer } from '@/components/admin/kit/Drawer'
import { SLUG_PATTERN, SlugField } from '@/components/admin/kit/form/SlugField'
import { IconPicker } from '@/components/admin/kit/IconPicker'
import { localeErrors, LocaleTabs, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { EmptyPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { toAdminApiError } from '@/lib/admin/errors'
import { useAdminErrorMessage } from '@/lib/admin/hooks'
import { adminSession } from '@/lib/admin/session'
import { toast } from '@/lib/admin/toast'
import {
  ADMIN_LOCALES,
  compactOptional,
  compactRequired,
  localeFromPath,
  localesWithContent,
  toEditable,
  type AdminLocale,
} from '@/lib/admin/translatable'
import { confirmDiscardChanges, useUnsavedChanges } from '@/lib/admin/unsaved'
import type { AdminCategory, AdminMediaRef, CategoryWrite } from '@/lib/api/types'
import { categoriesApi } from '../api'
import { asL } from '../editor/types'
import type { L } from '../editor/model'

interface CategoryForm {
  slug: string
  name: L
  shortName: L
  kicker: L
  description: L
  icon: string | null
  image: AdminMediaRef | null
  order: number
}

const LIMITS = { name: 120, shortName: 60, kicker: 80, description: 500 } as const

const trimL = (l: L): L => ({ en: l.en.trim(), zh: l.zh.trim(), de: l.de.trim() })

function toForm(category: AdminCategory | null, nextOrder: number): CategoryForm {
  return {
    slug: category?.slug ?? '',
    name: toEditable(category?.name),
    shortName: toEditable(category?.shortName),
    kicker: toEditable(category?.kicker),
    description: toEditable(category?.description),
    icon: category?.icon ?? null,
    image: category?.image ?? null,
    order: category?.order ?? nextOrder,
  }
}

function toWrite(form: CategoryForm): CategoryWrite {
  return {
    slug: form.slug.trim(),
    name: compactRequired(trimL(form.name), ''),
    shortName: compactOptional(trimL(form.shortName)),
    kicker: compactOptional(trimL(form.kicker)),
    description: compactOptional(trimL(form.description)),
    icon: form.icon || null,
    imageId: form.image?.id ?? null,
    order: form.order,
  }
}

export interface CategoryDrawerProps {
  /** 'new', a category id, or null (closed). */
  id: string | null
  categories: AdminCategory[] | undefined
  nextOrder: number
  onClose: () => void
  onSaved: (category: AdminCategory, created: boolean) => void
  /** Asks for confirmation and deletes; resolves true when deleted. */
  onDelete: (category: AdminCategory) => Promise<boolean>
}

/** Create / edit drawer for a tour category (name, short name, kicker, description per locale; slug, icon, image). */
export function CategoryDrawer({ id, categories, nextOrder, onClose, onSaved, onDelete }: CategoryDrawerProps) {
  const t = useTranslations('adminTours.categories')
  if (!id) return null
  if (id !== 'new' && !categories) {
    return (
      <Drawer open onClose={onClose} title={t('editTitle')} size="lg">
        <LoadingPanel variant="form" rows={6} card={false} />
      </Drawer>
    )
  }
  const category = id === 'new' ? null : (categories?.find((c) => c.id === id) ?? null)
  if (id !== 'new' && !category) {
    return (
      <Drawer open onClose={onClose} title={t('notFoundTitle')} size="lg">
        <EmptyPanel icon="search_off" title={t('notFoundTitle')} body={t('notFoundBody')} />
      </Drawer>
    )
  }
  return (
    <CategoryEditor
      key={id}
      category={category}
      nextOrder={nextOrder}
      onClose={onClose}
      onSaved={onSaved}
      onDelete={onDelete}
    />
  )
}

function CategoryEditor({
  category,
  nextOrder,
  onClose,
  onSaved,
  onDelete,
}: {
  category: AdminCategory | null
  nextOrder: number
  onClose: () => void
  onSaved: (category: AdminCategory, created: boolean) => void
  onDelete: (category: AdminCategory) => Promise<boolean>
}) {
  const t = useTranslations('adminTours.categories')
  const tf = useTranslations('adminTours.categories.fields')
  const describe = useAdminErrorMessage()
  const isNew = category === null
  const [form, setForm] = useState<CategoryForm>(() => toForm(category, nextOrder))
  const [baseline, setBaseline] = useState(() => JSON.stringify(toWrite(toForm(category, nextOrder))))
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)
  const dirty = JSON.stringify(toWrite(form)) !== baseline
  useUnsavedChanges(dirty && !saving)

  useEffect(() => {
    if (!focusToken) return
    const frame = requestAnimationFrame(() => {
      const target = bodyRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [focusToken, locale])

  const set = <K extends keyof CategoryForm>(key: K, value: CategoryForm[K], clear: string = key) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!Object.keys(prev).some((p) => p === clear || p.startsWith(`${clear}.`))) return prev
      return Object.fromEntries(Object.entries(prev).filter(([p]) => !(p === clear || p.startsWith(`${clear}.`))))
    })
  }

  const close = async () => {
    if (dirty && !(await confirmDiscardChanges())) return
    onClose()
  }

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs)
    const first = Object.keys(errs)[0]
    const nextLocale = first ? localeFromPath(first) : undefined
    if (nextLocale) setLocale(nextLocale)
    setFocusToken((n) => n + 1)
  }

  const save = async () => {
    const clientErrors: Record<string, string> = {}
    const slug = form.slug.trim()
    if (!form.name.en.trim()) clientErrors['name.en'] = t('validation.required')
    if (!slug) clientErrors.slug = t('validation.required')
    else if (slug.length < 2 || !SLUG_PATTERN.test(slug)) clientErrors.slug = t('validation.slug')
    if (Object.keys(clientErrors).length) {
      showErrors(clientErrors)
      toast.error(t('fixErrors'))
      return
    }
    setSaving(true)
    try {
      const body = toWrite(form)
      const saved = isNew ? await categoriesApi.create(body) : await categoriesApi.update(category.id, body)
      setBaseline(JSON.stringify(body))
      toast.success(isNew ? t('created', { name: saved.name.en ?? saved.slug }) : t('saved', { name: saved.name.en ?? saved.slug }))
      onSaved(saved, isNew)
      onClose()
    } catch (raw) {
      const err = toAdminApiError(raw)
      if (err.isUnauthorized && adminSession.expired) return
      if (err.isValidationError && Object.keys(err.fieldErrors).length) {
        showErrors(err.fieldErrors)
        toast.error(t('fixErrors'), err.issues.slice(0, 4).map((i) => `${i.path}: ${i.message}`))
      } else if (err.isConflict) {
        showErrors({ slug: t('slugTaken') })
        toast.error(t('slugTakenToast'), err.message)
      } else {
        toast.error(t('saveFailed'), describe(err))
      }
    } finally {
      setSaving(false)
    }
  }

  const filled = localesWithContent(form.name, form.shortName, form.kicker, form.description)
  const errorLocales = Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, Object.keys(errors).some((p) => localeFromPath(p) === l)]),
  ) as Record<AdminLocale, boolean>
  const title = isNew ? t('newTitle') : t('editTitle')

  return (
    <Drawer
      open
      onClose={() => void close()}
      title={title}
      subtitle={!isNew ? (category.name.en ?? category.slug) : undefined}
      size="lg"
      footer={
        <>
          {!isNew && (
            <Button
              variant="dangerGhost"
              icon="delete"
              onClick={async () => {
                if (await onDelete(category)) onClose()
              }}
            >
              {t('deleteShort')}
            </Button>
          )}
          <span className="ml-auto" />
          <Button variant="ghost" onClick={() => void close()}>
            {t('cancel')}
          </Button>
          <Button variant="primary" icon="save" loading={saving} disabled={!dirty && !isNew} onClick={() => void save()}>
            {isNew ? t('create') : t('save')}
          </Button>
        </>
      }
    >
      <div
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault()
            void save()
          }
        }}
      >
        <div ref={bodyRef} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2">
            <span className="font-caption text-caption text-on-surface-variant">{t('localeHint')}</span>
            <LocaleTabs value={locale} onChange={setLocale} filled={filled} errors={errorLocales} />
          </div>
          <TranslatableText
            label={tf('name')}
            locale={locale}
            required
            value={form.name}
            onChange={(v) => set('name', asL(v), `name.${locale}`)}
            maxLength={LIMITS.name}
            counter
            error={localeErrors(errors, 'name')}
          />
          <SlugField
            value={form.slug}
            onChange={(slug) => set('slug', slug)}
            source={form.name.en}
            required
            error={errors.slug}
          />
          <TranslatableText
            label={tf('shortName')}
            locale={locale}
            value={form.shortName}
            onChange={(v) => set('shortName', asL(v), `shortName.${locale}`)}
            maxLength={LIMITS.shortName}
            counter
            hint={t('shortNameHint')}
            error={localeErrors(errors, 'shortName')}
          />
          <TranslatableText
            label={tf('kicker')}
            locale={locale}
            value={form.kicker}
            onChange={(v) => set('kicker', asL(v), `kicker.${locale}`)}
            maxLength={LIMITS.kicker}
            counter
            hint={t('kickerHint')}
            error={localeErrors(errors, 'kicker')}
          />
          <TranslatableText
            label={tf('description')}
            locale={locale}
            multiline={3}
            value={form.description}
            onChange={(v) => set('description', asL(v), `description.${locale}`)}
            maxLength={LIMITS.description}
            counter
            error={localeErrors(errors, 'description')}
          />
          <IconPicker
            label={tf('icon')}
            value={form.icon}
            onChange={(icon) => set('icon', icon)}
            hint={t('iconHint')}
            error={errors.icon}
          />
          <ImageField
            label={tf('image')}
            value={form.image}
            onChange={(image) => set('image', image, 'imageId')}
            folder="categories"
            hint={t('imageHint')}
            error={errors.imageId}
          />
          {!isNew && (
            <p className="font-caption text-caption text-on-surface-variant">{t('linkedTours', { count: category.tourCount })}</p>
          )}
        </div>
      </div>
    </Drawer>
  )
}

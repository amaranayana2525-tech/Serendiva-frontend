'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { Drawer } from '@/components/admin/kit/Drawer'
import { localeErrors, LocaleTabs, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { Switch } from '@/components/admin/kit/form/Switch'
import { EmptyPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import {
  ADMIN_LOCALES,
  compactRequired,
  localeFromPath,
  localesWithContent,
  toEditable,
  type AdminLocale,
} from '@/lib/admin/translatable'
import { confirmDiscardChanges, skipUnsavedCheck, useUnsavedChanges } from '@/lib/admin/unsaved'
import { nestedDialogGuard } from '../destinations/lib/nestedDialogs'
import type { AdminFaq, FaqWrite } from '@/lib/api/types'
import { destinationsApi } from '../destinations/lib/api'
import { tourOptionsApi } from '../reviews/api'
import { FAQ_SCOPES, faqsApi, type FaqScope } from './api'

/** Where a new FAQ goes (the scope tab / tour / destination the list shows). */
export interface FaqGroupTarget {
  scope: FaqScope
  tourId?: string
  destinationId?: string
}

/** Reorder group of an FAQ: the scope, or the tour / destination for scoped FAQs. */
export const groupKeyOf = (f: { scope: FaqScope; tourId?: string | null; destinationId?: string | null }) =>
  f.scope === 'tour' ? `tour:${f.tourId ?? ''}` : f.scope === 'destination' ? `destination:${f.destinationId ?? ''}` : f.scope

interface FaqForm {
  scope: FaqScope
  tourId: string
  destinationId: string
  question: Record<AdminLocale, string>
  answer: Record<AdminLocale, string>
  status: 'draft' | 'published'
}

const LIMITS = { question: 300, answer: 5000 } as const

export interface FaqDrawerProps {
  /** 'new', an FAQ id, or null (closed). */
  id: string | null
  faqs: AdminFaq[] | undefined
  defaultTarget: FaqGroupTarget
  onClose: () => void
}

/** Create / edit an FAQ (question + answer per language, scope, linked tour or destination, status). */
export function FaqDrawer({ id, faqs, defaultTarget, onClose }: FaqDrawerProps) {
  const t = useTranslations('adminContent.faqs.form')
  const isNew = id === 'new'
  const faq = id && !isNew ? faqs?.find((f) => f.id === id) : undefined
  const close = async () => {
    if (await confirmDiscardChanges()) onClose()
  }
  return (
    <Drawer
      open={id !== null}
      onClose={() => void close()}
      size="lg"
      title={isNew ? t('newTitle') : t('editTitle')}
      subtitle={faq ? faq.question.en : isNew ? t('newSubtitle') : undefined}
    >
      {id === null ? null : isNew ? (
        <FaqFormView key={`new-${groupKeyOf(defaultTarget)}`} faq={null} faqs={faqs ?? []} target={defaultTarget} onDone={onClose} />
      ) : faq ? (
        <FaqFormView key={faq.id} faq={faq} faqs={faqs ?? []} target={defaultTarget} onDone={onClose} />
      ) : faqs ? (
        <EmptyPanel icon="search_off" title={t('notFoundTitle')} body={t('notFoundBody')} />
      ) : (
        <LoadingPanel variant="form" rows={5} card={false} />
      )}
    </Drawer>
  )
}

function FaqFormView({
  faq,
  faqs,
  target,
  onDone,
}: {
  faq: AdminFaq | null
  faqs: AdminFaq[]
  target: FaqGroupTarget
  onDone: () => void
}) {
  const t = useTranslations('adminContent.faqs.form')
  const tf = useTranslations('adminContent.faqs')
  const tc = useTranslations('adminContent.common')
  const tl = useTranslations('admin.kit.locales')
  const confirm = useConfirm()
  const describe = useAdminErrorMessage()
  const [initial] = useState<FaqForm>(() => ({
    scope: faq?.scope ?? target.scope,
    tourId: faq?.tourId ?? target.tourId ?? '',
    destinationId: faq?.destinationId ?? target.destinationId ?? '',
    question: toEditable(faq?.question),
    answer: toEditable(faq?.answer),
    status: faq?.status ?? 'published',
  }))
  const [form, setForm] = useState(initial)
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
  useUnsavedChanges(dirty && !saving && !deleting)

  const tours = useAdminQuery(['tour-options'], (signal) => tourOptionsApi.list(signal), [], { enabled: form.scope === 'tour' })
  const destinations = useAdminQuery(
    ['destination-options'],
    async (signal) => (await destinationsApi.list({ pageSize: 100 }, signal)).items.map((d) => ({ value: d.id, label: d.name })),
    [],
    { enabled: form.scope === 'destination' },
  )

  const set = <K extends keyof FaqForm>(key: K, value: FaqForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([p]) => p !== key && !p.startsWith(`${key}.`))))
  }

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs)
    const l = localeFromPath(Object.keys(errs)[0] ?? '')
    if (l) setLocale(l)
    requestAnimationFrame(() => document.querySelector<HTMLElement>('dialog[open] [aria-invalid="true"]')?.focus())
  }

  const save = async () => {
    const errs: Record<string, string> = {}
    if (!form.question.en.trim()) errs['question.en'] = t('errors.required')
    if (!form.answer.en.trim()) errs['answer.en'] = t('errors.required')
    for (const l of ADMIN_LOCALES) {
      if (l === 'en') continue
      const q = form.question[l].trim()
      const a = form.answer[l].trim()
      if (q && !a) errs[`answer.${l}`] = t('errors.translateBoth')
      if (a && !q) errs[`question.${l}`] = t('errors.translateBoth')
    }
    if (form.scope === 'tour' && !form.tourId) errs.tourId = t('errors.tour')
    if (form.scope === 'destination' && !form.destinationId) errs.destinationId = t('errors.destination')
    if (Object.keys(errs).length) {
      showErrors(errs)
      toast.error(tc('fixErrors'))
      return
    }
    const tourId = form.scope === 'tour' ? form.tourId || null : null
    const destinationId = form.scope === 'destination' ? form.destinationId || null : null
    const key = groupKeyOf({ scope: form.scope, tourId, destinationId })
    const sameGroup = faq !== null && groupKeyOf(faq) === key
    const order = sameGroup
      ? faq.order
      : faqs.filter((f) => f.id !== faq?.id && groupKeyOf(f) === key).reduce((max, f) => Math.max(max, f.order + 1), 0)
    const body: FaqWrite = {
      scope: form.scope,
      question: compactRequired(form.question, ''),
      answer: compactRequired(form.answer, ''),
      order,
      status: form.status,
      tourId,
      destinationId,
    }
    setSaving(true)
    try {
      if (faq) await faqsApi.update(faq.id, body)
      else await faqsApi.create(body)
      toast.success(faq ? t('savedToast') : t('createdToast'))
      invalidateAdminQueries('faqs')
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
    if (!faq) return
    const ok = await confirm({
      title: tf('deleteTitle'),
      body: tf('deleteBody'),
      confirmLabel: tf('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    setDeleting(true)
    try {
      await faqsApi.remove(faq.id)
      toast.success(tf('deletedToast'))
      invalidateAdminQueries('faqs')
      skipUnsavedCheck()
      onDone()
    } catch (raw) {
      toast.error(describe(raw))
      setDeleting(false)
    }
  }

  const filled = localesWithContent(form.question, form.answer)
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label={t('fields.scope')}
          required
          value={form.scope}
          onValueChange={(v) => v && set('scope', v)}
          options={FAQ_SCOPES.map((s) => ({ value: s, label: tf(`scopes.${s}`) }))}
          hint={t(`scopeHints.${form.scope}`)}
          error={errors.scope}
        />
        {form.scope === 'tour' && (
          <SelectField
            label={t('fields.tour')}
            required
            value={form.tourId}
            onValueChange={(v) => set('tourId', v)}
            options={tours.data ?? []}
            placeholder={tours.loading ? t('loading') : t('chooseTour')}
            error={errors.tourId}
          />
        )}
        {form.scope === 'destination' && (
          <SelectField
            label={t('fields.destination')}
            required
            value={form.destinationId}
            onValueChange={(v) => set('destinationId', v)}
            options={destinations.data ?? []}
            placeholder={destinations.loading ? t('loading') : t('chooseDestination')}
            error={errors.destinationId}
          />
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-surface-container-high p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body-md text-[13px] font-semibold text-on-surface">{tc('contentLanguage')}</p>
          <LocaleTabs value={locale} onChange={setLocale} filled={filled} errors={localeErrorFlags} />
        </div>
        <TranslatableText
          label={t('fields.question')}
          required
          value={form.question}
          onChange={(v) => set('question', { ...form.question, ...v })}
          locale={locale}
          maxLength={LIMITS.question}
          counter
          error={localeErrors(errors, 'question')}
        />
        <TranslatableText
          label={t('fields.answer')}
          required
          multiline={8}
          value={form.answer}
          onChange={(v) => set('answer', { ...form.answer, ...v })}
          locale={locale}
          maxLength={LIMITS.answer}
          counter
          hint={t('hints.answer')}
          error={localeErrors(errors, 'answer')}
        />
        {locale !== 'en' && (
          <p className="font-caption text-caption text-on-surface-variant">{t('hints.translation', { language: tl(`${locale}.name`) })}</p>
        )}
      </div>

      <Switch
        checked={form.status === 'published'}
        onCheckedChange={(v) => set('status', v ? 'published' : 'draft')}
        label={t('fields.published')}
        description={t('hints.published')}
      />

      <div className="sticky -bottom-4 z-10 -mx-4 -mb-4 mt-auto md:-bottom-5 flex flex-wrap items-center gap-2 border-t border-surface-container-high bg-surface-container-lowest px-4 py-3 md:-mx-6 md:-mb-5 md:px-6">
        {faq && (
          <Button variant="dangerGhost" icon="delete" onClick={() => void onDelete()} loading={deleting}>
            {t('delete')}
          </Button>
        )}
        <span className="ml-auto" />
        {dirty && <span className="font-caption text-caption text-secondary">{t('unsaved')}</span>}
        <Button variant="ghost" onClick={() => void confirmDiscardChanges().then((ok) => ok && onDone())}>
          {tc('cancel')}
        </Button>
        <Button type="submit" variant="primary" icon="save" loading={saving} disabled={!dirty && faq !== null}>
          {faq ? t('save') : t('create')}
        </Button>
      </div>
    </form>
  )
}

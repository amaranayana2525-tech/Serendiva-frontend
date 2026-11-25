'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { LocaleTabs } from '@/components/admin/kit/LocaleTabs'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { toast } from '@/lib/admin/toast'
import { ADMIN_LOCALES, hasContent, localeFromPath, type AdminLocale } from '@/lib/admin/translatable'
import { skipUnsavedCheck, useUnsavedChanges } from '@/lib/admin/unsaved'
import type { AdminDestination, AdminMediaRef, AdminRegion } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { faqsApi } from '../faqs/api'
import { EditorProvider } from './editor/EditorContext'
import { ExperiencesTab } from './editor/ExperiencesTab'
import { FoodStaysTab } from './editor/FoodStaysTab'
import { HighlightsTab } from './editor/HighlightsTab'
import { MediaTab } from './editor/MediaTab'
import { OverviewTab } from './editor/OverviewTab'
import { SeoTab } from './editor/SeoTab'
import { destinationPublicPath, destinationsApi, regionsApi } from './lib/api'
import {
  EDITOR_TABS,
  emptyDestinationForm,
  errorsByTab,
  filledLocales,
  LOCALIZED_KEYS,
  tabOfPath,
  toDestinationForm,
  toDestinationWrite,
  validateDestination,
  type DestinationForm,
  type EditorTab,
  type FieldErrors,
} from './lib/destinationForm'
import { EditorTabs } from './ui/EditorTabs'

const TAB_ICONS: Record<EditorTab, string> = {
  overview: 'badge',
  highlights: 'auto_awesome',
  experiences: 'hiking',
  food: 'restaurant',
  media: 'photo_library',
  seo: 'travel_explore',
}

/** /admin/destinations/new and /admin/destinations/[id] — loads the record, then renders the editor form. */
export function DestinationEditor({ id }: { id: string }) {
  const t = useTranslations('adminContent.editor')
  const tn = useTranslations('admin.nav')
  const isNew = id === 'new'
  const detail = useAdminQuery(['destination', id], (signal) => destinationsApi.get(id, signal), [], {
    enabled: !isNew,
    keepPreviousData: false,
  })
  const regions = useAdminQuery(['regions'], (signal) => regionsApi.list(signal))
  const crumbs = [{ label: tn('destinations'), href: '/admin/destinations' }]

  if (!isNew && !detail.data) {
    return (
      <>
        <PageHeader title={t('loadingTitle')} breadcrumbs={[...crumbs, { label: t('loadingTitle') }]} />
        {detail.error ? (
          detail.error.isNotFound ? (
            <ErrorPanel
              error={detail.error}
              title={t('notFoundTitle')}
              onRetry={undefined}
              className="py-12"
            />
          ) : (
            <ErrorPanel error={detail.error} onRetry={() => void detail.refetch()} />
          )
        ) : (
          <LoadingPanel variant="form" rows={8} />
        )}
        {detail.error?.isNotFound && (
          <div className="mt-4 flex justify-center">
            <Button href="/admin/destinations" icon="arrow_back">
              {t('backToList')}
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <DestinationEditorForm
      key={isNew ? 'new' : id}
      record={isNew ? null : (detail.data ?? null)}
      regions={regions.data}
      onSaved={(saved) => detail.setData(saved)}
    />
  )
}

/** Value at a dotted API error path inside the form ('coverId' → form.cover.id). */
function valueAtPath(form: DestinationForm, path: string): unknown {
  if (path === 'coverId') return form.cover?.id ?? null
  let node: unknown = form
  for (const part of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return node
}

interface ServerErrors {
  errors: FieldErrors
  /** JSON of each field's value when the error was reported — the error hides once the value changes. */
  snapshot: Record<string, string>
}

function DestinationEditorForm({
  record,
  regions,
  onSaved,
}: {
  record: AdminDestination | null
  regions: AdminRegion[] | undefined
  onSaved: (saved: AdminDestination) => void
}) {
  const t = useTranslations('adminContent.editor')
  const tc = useTranslations('adminContent.common')
  const td = useTranslations('adminContent.destinations')
  const tn = useTranslations('admin.nav')
  const tl = useTranslations('admin.kit.locales')
  const router = useRouter()
  const confirm = useConfirm()
  const describe = useAdminErrorMessage()
  const isNew = record === null

  const [initial, setInitial] = useState<DestinationForm>(() => (record ? toDestinationForm(record) : emptyDestinationForm()))
  const [form, setFormState] = useState<DestinationForm>(initial)
  const [refs, setRefs] = useState<Record<string, AdminMediaRef>>(() => ({ ...(record?.mediaRefs ?? {}) }))
  const [tab, setTab] = useState<EditorTab>('overview')
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [serverErrors, setServerErrors] = useState<ServerErrors | null>(null)
  const [epoch, setEpoch] = useState(0)
  const [focusRequest, setFocusRequest] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])
  useUnsavedChanges(dirty && !saving && !deleting)

  const messages = useMemo(
    () => ({ required: t('errors.required'), icon: t('errors.icon'), slug: t('errors.slug'), number: t('errors.number') }),
    [t],
  )
  const errors = useMemo(() => {
    const out: FieldErrors = attempted ? validateDestination(form, messages) : {}
    if (serverErrors) {
      for (const [path, message] of Object.entries(serverErrors.errors)) {
        if (JSON.stringify(valueAtPath(form, path) ?? null) === serverErrors.snapshot[path]) out[path] ??= message
      }
    }
    return out
  }, [attempted, form, messages, serverErrors])
  const tabErrors = errorsByTab(errors)
  const localeErrorFlags = useMemo(() => {
    const out: Partial<Record<AdminLocale, boolean>> = {}
    for (const path of Object.keys(errors)) {
      const l = localeFromPath(path)
      if (l) out[l] = true
    }
    return out
  }, [errors])

  // Focus the first invalid control after jumping to the tab/locale that contains it.
  useEffect(() => {
    if (!focusRequest) return
    const id = requestAnimationFrame(() => {
      const root = panelRef.current
      if (!root) return
      const target =
        root.querySelector<HTMLElement>('[aria-invalid="true"]') ?? root.querySelector<HTMLElement>('p[id$="-error"]')
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      target?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [focusRequest])

  const jumpToFirstError = (errs: FieldErrors) => {
    const paths = Object.keys(errs)
    if (!paths.length) return
    const first = [...paths].sort((a, b) => EDITOR_TABS.indexOf(tabOfPath(a)) - EDITOR_TABS.indexOf(tabOfPath(b)))[0]
    setTab(tabOfPath(first))
    const l = localeFromPath(first)
    if (l) setLocale(l)
    setEpoch((e) => e + 1)
    setFocusRequest((n) => n + 1)
  }

  const save = async () => {
    if (saving) return
    setAttempted(true)
    const clientErrors = validateDestination(form, messages)
    if (Object.keys(clientErrors).length) {
      setServerErrors(null)
      jumpToFirstError(clientErrors)
      toast.error(tc('fixErrors'), tc('errorCount', { count: Object.keys(clientErrors).length }))
      return
    }
    setSaving(true)
    try {
      const body = toDestinationWrite(form)
      if (isNew) body.order = (await destinationsApi.list({ pageSize: 1 })).meta.total
      const saved = isNew ? await destinationsApi.create(body) : await destinationsApi.update(record.id, body)
      const name = saved.name.en ?? saved.slug
      invalidateAdminQueries(['destinations', 'destination-options', 'regions'])
      setServerErrors(null)
      setAttempted(false)
      if (isNew) {
        toast.success(t('created', { name }))
        skipUnsavedCheck()
        router.replace(`/admin/destinations/${saved.id}`)
        return
      }
      const next = toDestinationForm(saved)
      setRefs((prev) => ({ ...prev, ...saved.mediaRefs }))
      setInitial(next)
      setFormState(next)
      onSaved(saved)
      toast.success(t('saved', { name }))
    } catch (raw) {
      const error = toAdminApiError(raw)
      let fieldErrors: FieldErrors = error.fieldErrors
      if (error.isConflict) fieldErrors = { slug: error.message || t('errors.slugTaken') }
      if (Object.keys(fieldErrors).length) {
        const snapshot: Record<string, string> = {}
        for (const path of Object.keys(fieldErrors)) snapshot[path] = JSON.stringify(valueAtPath(form, path) ?? null)
        setServerErrors({ errors: fieldErrors, snapshot })
        jumpToFirstError(fieldErrors)
      }
      toast.error(
        error.isConflict ? t('errors.slugTaken') : describe(error),
        error.isValidationError ? error.issues.slice(0, 4).map((i) => `${i.path}: ${i.message}`) : undefined,
      )
    } finally {
      setSaving(false)
    }
  }

  // ⌘/Ctrl + S saves.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onDelete = async () => {
    if (!record) return
    let faqCount: number | null = null
    try {
      faqCount = (await faqsApi.list({ scope: 'destination', destinationId: record.id })).length
    } catch {
      faqCount = null
    }
    const name = record.name.en ?? record.slug
    const ok = await confirm({
      title: td('deleteTitle', { name }),
      body: (
        <div className="flex flex-col gap-2">
          <p>{td('deleteBody')}</p>
          <p className="font-semibold text-secondary">
            {faqCount === null ? td('deleteFaqsUnknown') : td('deleteFaqs', { count: faqCount })}
          </p>
          {record.tourIds.length > 0 && <p>{td('deleteTours', { count: record.tourIds.length })}</p>}
        </div>
      ),
      confirmLabel: td('deleteConfirm'),
      tone: 'danger',
      icon: 'delete',
    })
    if (!ok) return
    setDeleting(true)
    try {
      await destinationsApi.remove(record.id)
      toast.success(td('deletedToast', { name }))
      invalidateAdminQueries(['destinations', 'destination-options', 'faqs', 'regions'])
      skipUnsavedCheck()
      router.push('/admin/destinations')
    } catch (raw) {
      toast.error(describe(raw))
      setDeleting(false)
    }
  }

  const title = form.name.en.trim() || (isNew ? t('newTitle') : (record?.slug ?? ''))
  const filled = filledLocales(form)
  const publicHref = record && initial.status === 'published' ? destinationPublicPath(initial.slug, locale) : null
  const tabs = EDITOR_TABS.map((value) => ({ value, label: t(`tabs.${value}`), icon: TAB_ICONS[value], errors: tabErrors[value] }))

  const saveButton = (
    <Button variant="primary" icon="save" onClick={() => void save()} loading={saving} disabled={!dirty && !isNew}>
      {isNew ? t('create') : t('save')}
    </Button>
  )

  return (
    <EditorProvider
      value={{
        form,
        setForm: setFormState,
        locale,
        errors,
        refs,
        addRef: (ref) => setRefs((prev) => ({ ...prev, [ref.id]: ref })),
        epoch,
        regions,
      }}
    >
      <PageHeader
        title={title}
        breadcrumbs={[{ label: tn('destinations'), href: '/admin/destinations' }, { label: isNew ? t('newTitle') : title }]}
        meta={
          <>
            {!isNew && <StatusBadge kind="content" status={initial.status} size="md" />}
            {dirty && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-2 py-0.5 font-body-md text-[12px] font-medium text-on-secondary-fixed-variant">
                <Icon name="edit" className="text-[14px]" />
                {t('unsaved')}
              </span>
            )}
          </>
        }
        actions={
          <>
            {publicHref && (
              <Button href={publicHref} external icon="open_in_new">
                {tc('viewOnSiteShort')}
              </Button>
            )}
            {saveButton}
          </>
        }
      />

      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-surface-container-high bg-surface-container-low/95 px-4 py-2 backdrop-blur-md md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
          <EditorTabs idPrefix="destination" label={t('tabsLabel')} tabs={tabs} value={tab} onChange={setTab} />
          <LocaleTabs value={locale} onChange={setLocale} filled={filled} errors={localeErrorFlags} className="self-start md:self-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div
          ref={panelRef}
          id="destination-panel"
          role="tabpanel"
          aria-labelledby={`destination-tab-${tab}`}
          tabIndex={-1}
          className="min-w-0 focus:outline-none"
        >
          {tab === 'overview' && <OverviewTab />}
          {tab === 'highlights' && <HighlightsTab />}
          {tab === 'experiences' && <ExperiencesTab />}
          {tab === 'food' && <FoodStaysTab />}
          {tab === 'media' && <MediaTab />}
          {tab === 'seo' && <SeoTab />}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-32 lg:self-start" aria-label={t('sidebarLabel')}>
          <Card title={t('publish.title')} icon="public" headingLevel={2}>
            <div className="flex flex-col gap-3">
              <div role="radiogroup" aria-label={t('publish.status')} className="grid grid-cols-2 gap-1 rounded-xl bg-surface-container p-1">
                {(['draft', 'published'] as const).map((s) => {
                  const active = form.status === s
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFormState((prev) => ({ ...prev, status: s }))}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-body-md text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        active ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary',
                      )}
                    >
                      <Icon name={s === 'published' ? 'public' : 'edit_note'} className="text-[18px]" />
                      {tc(`status.${s}`)}
                    </button>
                  )
                })}
              </div>
              <p className="font-caption text-caption text-on-surface-variant">
                {form.status === 'published' ? t('publish.publishedHint') : t('publish.draftHint')}
              </p>
              {saveButton}
              <p className="hidden font-caption text-caption text-on-surface-variant lg:block">{t('publish.shortcut')}</p>
              {record && (
                <p className="font-caption text-caption text-on-surface-variant">
                  {t('publish.updated', { date: new Date(record.updatedAt) })}
                </p>
              )}
            </div>
          </Card>

          <Card title={t('translations.title')} icon="translate">
            <ul className="flex flex-col gap-2.5">
              {ADMIN_LOCALES.map((l) => {
                const count = LOCALIZED_KEYS.filter((k) => hasContent(form[k][l])).length
                const total = LOCALIZED_KEYS.length
                return (
                  <li key={l}>
                    <button
                      type="button"
                      onClick={() => setLocale(l)}
                      aria-pressed={locale === l}
                      className="flex w-full flex-col gap-1 rounded-lg px-1.5 py-1 text-left hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="flex items-center justify-between gap-2 font-body-md text-body-md">
                        <span className={cn('font-medium', locale === l ? 'text-primary' : 'text-on-surface')}>{tl(`${l}.name`)}</span>
                        <span className="font-caption text-caption tabular-nums text-on-surface-variant">
                          {t('translations.count', { count, total })}
                        </span>
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-surface-container" aria-hidden="true">
                        <span
                          className={cn('block h-full rounded-full', count ? 'bg-tertiary-container' : 'bg-transparent')}
                          style={{ width: `${Math.round((count / total) * 100)}%` }}
                        />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 font-caption text-caption text-on-surface-variant">{t('translations.hint')}</p>
          </Card>

          {record && (
            <Card title={t('info.title')} icon="info">
              <dl className="flex flex-col gap-1.5 font-body-md text-body-md">
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant">{t('info.tours')}</dt>
                  <dd className="font-medium tabular-nums">{record.tourIds.length}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant">{t('info.gallery')}</dt>
                  <dd className="font-medium tabular-nums">{form.gallery.length}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-on-surface-variant">{t('info.created')}</dt>
                  <dd className="font-medium">{t('info.date', { date: new Date(record.createdAt) })}</dd>
                </div>
              </dl>
              <p className="mt-2 font-caption text-caption text-on-surface-variant">{t('info.toursHint')}</p>
              <Button variant="dangerGhost" icon="delete" className="mt-3 w-full" onClick={() => void onDelete()} loading={deleting}>
                {t('delete')}
              </Button>
            </Card>
          )}
        </aside>
      </div>

      {/* phones: unsaved changes bar */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-surface-container-high bg-surface-container-lowest/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <span className="font-body-md text-body-md text-on-surface-variant">{t('unsavedLong')}</span>
          {saveButton}
        </div>
      )}
    </EditorProvider>
  )
}

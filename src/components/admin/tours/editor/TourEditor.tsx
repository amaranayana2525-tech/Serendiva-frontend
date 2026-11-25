'use client'

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { Button, IconButton } from '@/components/admin/kit/Button'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { LocaleTabs } from '@/components/admin/kit/LocaleTabs'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { toAdminApiError } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminQuery } from '@/lib/admin/hooks'
import { adminSession } from '@/lib/admin/session'
import { toast } from '@/lib/admin/toast'
import { ADMIN_LOCALES, localeFromPath, type AdminLocale } from '@/lib/admin/translatable'
import { skipUnsavedCheck, useUnsavedChanges } from '@/lib/admin/unsaved'
import { useUrlParam } from '@/lib/admin/url-state'
import type { AdminTour } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { publicTourPath, toursApi, type TourStatus } from '../api'
import { describePath } from './describePath'
import { DestinationsTab } from './DestinationsTab'
import { DetailsTab } from './DetailsTab'
import { GalleryTab } from './GalleryTab'
import { ItineraryTab } from './ItineraryTab'
import {
  cloneTourForDuplicate,
  EDITOR_TABS,
  filledLocales,
  fromAdmin,
  isEditorTab,
  newTourForm,
  publishWarnings,
  snapshot,
  tabForPath,
  toWrite,
  validate,
  withoutErrors,
  type EditorTab,
  type TourForm,
} from './model'
import { SeoTab } from './SeoTab'
import type { UpdateField } from './types'

interface EditorState {
  form: TourForm
  /** Snapshot of the last saved version (dirty check). */
  baseline: string
  /** Last version returned by the API (null for a new tour). */
  tour: AdminTour | null
}

/** A freshly created tour, handed to the editor that mounts at its new URL (no reload flash). */
const primed = new Map<string, AdminTour>()

const fromTour = (tour: AdminTour): EditorState => {
  const form = fromAdmin(tour)
  return { form, baseline: snapshot(form), tour }
}

const TAB_ICONS: Record<EditorTab, { icon: string }> = {
  details: { icon: 'description' },
  itinerary: { icon: 'route' },
  gallery: { icon: 'photo_library' },
  destinations: { icon: 'location_on' },
  seo: { icon: 'travel_explore' },
}

/** Icons of the publish toggle (object form so the sprite builder picks them up). */
const STATUS_ICONS = { publish: { icon: 'publish' }, unpublish: { icon: 'unpublished' } } as const

/** Next free display order (new tours go to the end of the list). */
async function nextOrder(): Promise<number> {
  try {
    const first = await toursApi.list({ page: 1, pageSize: 100 })
    const last =
      first.meta.totalPages > 1 ? await toursApi.list({ page: first.meta.totalPages, pageSize: 100 }) : first
    return [...first.items, ...last.items].reduce((max, item) => Math.max(max, item.order + 1), 0)
  } catch {
    return 0
  }
}

/**
 * /admin/tours/new and /admin/tours/[id] — the tour editor: global EN/中文/DE switch, five URL-synced tabs, sticky
 * action bar (save ⌘/Ctrl+S, publish toggle, preview, delete), unsaved-changes guard and validation errors mapped to
 * the right tab/locale/field.
 */
export function TourEditor({ id }: { id: string }) {
  const isNew = id === 'new'
  const t = useTranslations('adminTours.editor')
  const tv = useTranslations('adminTours.editor.validation')
  const tf = useTranslations('adminTours.editor.fields')
  const tl = useTranslations('admin.kit.locales')
  const format = useFormatter()
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const router = useRouter()

  const { value: duplicateId } = useUrlParam('duplicate')
  const duplicating = isNew && Boolean(duplicateId)

  const [state, setState] = useState<EditorState | null>(() => {
    if (isNew && !duplicateId) {
      const form = newTourForm()
      return { form, baseline: snapshot(form), tour: null }
    }
    const handedOver = primed.get(id)
    return handedOver ? fromTour(handedOver) : null
  })
  useEffect(() => {
    primed.delete(id)
  }, [id])

  const query = useAdminQuery(['tours', 'detail', id], (signal) => toursApi.get(id, signal), [], {
    enabled: !isNew && state === null,
    keepPreviousData: false,
  })
  const duplicateQuery = useAdminQuery(
    ['tours', 'duplicate', duplicateId],
    (signal) => toursApi.get(duplicateId!, signal),
    [],
    {
      enabled: duplicating && state === null,
      keepPreviousData: false,
    },
  )
  // Initialise once from fresh data (never from a stale cache entry); later refetches never overwrite edits.
  if (state === null && !duplicating && query.data && !query.fetching) setState(fromTour(query.data))
  if (state === null && duplicating && duplicateQuery.data && !duplicateQuery.fetching) {
    setState({ form: cloneTourForDuplicate(duplicateQuery.data), baseline: snapshot(newTourForm()), tour: null })
  }

  const [locale, setLocale] = useState<AdminLocale>('en')
  const { value: tabValue, set: setTabParam } = useUrlParam('tab')
  const tab: EditorTab = isEditorTab(tabValue) ? tabValue : 'details'
  const setTab = useCallback((next: EditorTab) => setTabParam(next === 'details' ? null : next), [setTabParam])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingFocus, setPendingFocus] = useState<{ tab: EditorTab; token: number } | null>(null)
  const [expandToken, setExpandToken] = useState(0)
  const [saving, setSaving] = useState(false)
  const [statusPending, setStatusPending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<EditorTab, HTMLButtonElement | null>>>({})

  const form = state?.form
  const dirty = useMemo(() => (state ? snapshot(state.form) !== state.baseline : false), [state])
  useUnsavedChanges(dirty && !saving && !deleting)

  const update: UpdateField = useCallback((key, value, clear) => {
    setState((prev) => {
      if (!prev) return prev
      const current = prev.form[key]
      const next = typeof value === 'function' ? (value as (p: typeof current) => typeof current)(current) : value
      return { ...prev, form: { ...prev.form, [key]: next } }
    })
    setErrors((prev) => withoutErrors(prev, clear ?? [key]))
  }, [])

  // Reveal the first error once its tab is showing.
  useEffect(() => {
    if (!pendingFocus || pendingFocus.tab !== tab) return
    const frame = requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-field-error]')
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        if (target.matches('input, textarea, select, button')) target.focus({ preventScroll: true })
      }
      setPendingFocus(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingFocus, tab, locale])

  const summarise = (errs: Record<string, string>) =>
    Object.entries(errs)
      .slice(0, 4)
      .map(([path, message]) => (path === '_form' ? message : `${describePath(path, tf, tl)}: ${message}`))

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs)
    const first = Object.keys(errs).find((p) => p !== '_form')
    if (!first) return
    const nextTab = tabForPath(first)
    const nextLocale = localeFromPath(first)
    if (nextLocale) setLocale(nextLocale)
    if (nextTab !== tab) setTab(nextTab)
    if (Object.keys(errs).some((p) => p.startsWith('days.'))) setExpandToken((n) => n + 1)
    setPendingFocus({ tab: nextTab, token: Date.now() })
  }

  const handleSaveError = (raw: unknown) => {
    const err = toAdminApiError(raw)
    if (err.isUnauthorized && adminSession.expired) return
    if (err.isValidationError && Object.keys(err.fieldErrors).length) {
      showErrors(err.fieldErrors)
      toast.error(t('fixErrors'), summarise(err.fieldErrors))
    } else if (err.isConflict) {
      showErrors({ slug: t('slugTaken') })
      toast.error(t('slugTakenToast'), err.message)
    } else {
      toast.error(t('saveFailed'), describe(err))
    }
  }

  const save = async (nextStatus?: TourStatus) => {
    if (!state || saving) return
    const start = state.form
    const target: TourForm = nextStatus ? { ...start, status: nextStatus } : start
    const clientErrors = Object.fromEntries(Object.entries(validate(target)).map(([path, code]) => [path, tv(code)]))
    if (Object.keys(clientErrors).length) {
      showErrors(clientErrors)
      toast.error(t('fixErrors'), summarise(clientErrors))
      return
    }
    setSaving(true)
    try {
      const body = toWrite(target)
      if (isNew) {
        body.order = await nextOrder()
        const created = await toursApi.create(body)
        invalidateAdminQueries('tours')
        setErrors({})
        primed.set(created.id, created)
        skipUnsavedCheck()
        toast.success(created.status === 'published' ? t('createdPublished') : t('created'))
        router.replace(`/admin/tours/${created.id}${tab === 'details' ? '' : `?tab=${tab}`}`)
        return
      }
      const saved = await toursApi.update(id, body)
      invalidateAdminQueries('tours')
      setErrors({})
      const sent = snapshot(target)
      setState((prev) => {
        if (!prev) return prev
        // No edits while the request was in flight → adopt the server version; otherwise keep the newer edits.
        if (snapshot(prev.form) === snapshot(start)) return fromTour(saved)
        return { form: { ...prev.form, status: saved.status }, baseline: sent, tour: saved }
      })
      toast.success(
        nextStatus === 'published' ? t('savedPublished') : nextStatus === 'draft' ? t('savedUnpublished') : t('saved'),
      )
    } catch (raw) {
      handleSaveError(raw)
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (next: TourStatus) => {
    if (!state) return
    if (next === 'published') {
      const missing = publishWarnings(state.form)
      if (missing.length > 0) {
        const ok = await confirm({
          title: t('publishIncompleteTitle'),
          body: t('publishIncompleteBody', {
            missing: missing.map((k) => t(`missingItems.${k}`)).join(', '),
          }),
          confirmLabel: t('publishAnyway'),
        })
        if (!ok) return
      }
    }
    if (isNew || dirty) return save(next)
    const start = state.form
    setStatusPending(true)
    try {
      const saved = await toursApi.setStatus(id, next)
      invalidateAdminQueries('tours')
      setState((prev) =>
        prev
          ? {
              form: { ...prev.form, status: saved.status },
              baseline: snapshot({ ...start, status: saved.status }),
              tour: saved,
            }
          : prev,
      )
      toast.success(next === 'published' ? t('published') : t('unpublished'))
    } catch (raw) {
      const err = toAdminApiError(raw)
      if (!(err.isUnauthorized && adminSession.expired)) toast.error(t('statusFailed'), describe(err))
    } finally {
      setStatusPending(false)
    }
  }

  const remove = async () => {
    if (!state || isNew) return
    const title = state.tour ? (state.tour.title.en ?? state.tour.slug) : state.form.title.en
    const ok = await confirm({
      title: t('deleteTitle', { title }),
      body: t('deleteBody'),
      tone: 'danger',
      confirmLabel: t('deleteConfirm'),
    })
    if (!ok) return
    setDeleting(true)
    try {
      await toursApi.remove(id)
      invalidateAdminQueries('tours')
      toast.success(t('deleted', { title }))
      skipUnsavedCheck()
      router.push('/admin/tours')
    } catch (raw) {
      const err = toAdminApiError(raw)
      if (!(err.isUnauthorized && adminSession.expired)) toast.error(t('deleteFailed'), describe(err))
      setDeleting(false)
    }
  }

  const discard = async () => {
    if (!state?.tour || !dirty) return
    const ok = await confirm({
      title: t('discardTitle'),
      body: t('discardBody'),
      tone: 'danger',
      confirmLabel: t('discardConfirm'),
    })
    if (!ok) return
    setState(fromTour(state.tour))
    setErrors({})
    toast.info(t('discarded'))
  }

  // ⌘/Ctrl+S saves.
  const onSaveShortcut = useEffectEvent(() => {
    if (!state) return
    if (!dirty && !isNew) {
      toast.info(t('nothingToSave'))
      return
    }
    void save()
  })
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSaveShortcut()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ------------------------------------------------------------------------------------------------ render

  const activeQuery = duplicating ? duplicateQuery : query

  if (!form || !state) {
    if (activeQuery.error?.isNotFound) {
      return (
        <>
          <PageHeader title={t('notFoundTitle')} breadcrumbs={[{ label: t('breadcrumb'), href: '/admin/tours' }, { label: t('notFoundTitle') }]} />
          <EmptyPanel
            variant="card"
            icon="search_off"
            title={t('notFoundTitle')}
            body={duplicating ? t('duplicateLoadFailed') : t('notFoundBody')}
            action={
              <Button href="/admin/tours" variant="primary" icon="arrow_back">
                {t('backToList')}
              </Button>
            }
          />
        </>
      )
    }
    if (activeQuery.error) return <ErrorPanel error={activeQuery.error} onRetry={() => void activeQuery.refetch()} />
    return <LoadingPanel variant="form" rows={8} />
  }

  const published = form.status === 'published'
  const heading = form.title.en.trim() || (isNew ? t('newTitle') : state.tour?.slug) || t('untitled')
  const liveSlug = state.tour?.status === 'published' ? state.tour.slug : null
  const previewHref = liveSlug ? publicTourPath(liveSlug, locale) : null
  const tabErrors = new Set(Object.keys(errors).map(tabForPath))
  const localeErrorFlags = Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, Object.keys(errors).some((p) => localeFromPath(p) === l)]),
  ) as Record<AdminLocale, boolean>
  const counts: Partial<Record<EditorTab, number>> = {
    itinerary: form.days.length,
    gallery: form.gallery.length + (form.cover ? 1 : 0),
    destinations: form.destinationIds.length,
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    let next = index
    if (delta) next = (index + delta + EDITOR_TABS.length) % EDITOR_TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = EDITOR_TABS.length - 1
    else return
    e.preventDefault()
    const key = EDITOR_TABS[next]
    setTab(key)
    tabRefs.current[key]?.focus()
  }

  const tabProps = { form, locale, errors, update, onJumpTab: setTab }
  const duplicateSourceTitle = duplicateQuery.data ? duplicateQuery.data.title.en ?? duplicateQuery.data.slug : null

  return (
    <>
      <PageHeader
        title={heading}
        breadcrumbs={[{ label: t('breadcrumb'), href: '/admin/tours' }, { label: isNew ? t('newTitle') : heading }]}
        meta={
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge kind="content" status={form.status} size="md" />
            {form.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(201,162,75,0.22)] px-2 py-0.5 font-body-md text-[12px] font-medium text-on-surface">
                <Icon name="star" filled className="text-[13px]" />
                {tf('isFeatured')}
              </span>
            )}
          </span>
        }
        description={isNew ? t('newDescription') : undefined}
      />

      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-surface-container-high bg-surface-container-low/95 px-4 backdrop-blur-md md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 py-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative -mx-1 overflow-x-auto px-1 no-scrollbar">
            <div role="tablist" aria-label={t('tabsLabel')} className="flex w-max items-center gap-1">
              {EDITOR_TABS.map((key, index) => {
                const active = key === tab
                return (
                  <button
                    key={key}
                    ref={(el) => {
                      tabRefs.current[key] = el
                    }}
                    id={`tour-tab-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`tour-panel-${key}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(key)}
                    onKeyDown={(e) => onTabKey(e, index)}
                    className={cn(
                      'relative inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 font-body-md text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      active
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
                    )}
                  >
                    <Icon name={TAB_ICONS[key].icon} className="text-[18px]" />
                    {t(`tabs.${key}`)}
                    {counts[key] !== undefined && (
                      <span className="rounded-full bg-surface-container px-1.5 text-[12px] font-semibold tabular-nums text-on-surface-variant">
                        {counts[key]}
                      </span>
                    )}
                    {tabErrors.has(key) && (
                      <>
                        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-error" />
                        <span className="sr-only">{t('tabHasErrors')}</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LocaleTabs
              value={locale}
              onChange={setLocale}
              filled={filledLocales(form)}
              errors={localeErrorFlags}
              label={t('localeLabel')}
            />
          </div>
        </div>
        {locale !== 'en' && (
          <p className="-mt-0.5 flex items-center gap-1.5 pb-2 font-caption text-caption text-on-surface-variant">
            <Icon name="translate" className="shrink-0 text-[15px] text-secondary" />
            {t('editingLocale', { language: tl(`${locale}.name`) })}
          </p>
        )}
      </div>

      <div
        ref={panelRef}
        role="tabpanel"
        id={`tour-panel-${tab}`}
        aria-labelledby={`tour-tab-${tab}`}
        lang={locale === 'en' ? undefined : locale}
      >
        {duplicating && duplicateSourceTitle && (
          <p className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-fixed/30 px-4 py-2.5 font-body-md text-body-md text-on-surface">
            <Icon name="content_copy" className="shrink-0 text-[18px] text-primary" />
            <span>{t('duplicatingFrom', { title: duplicateSourceTitle })}</span>
          </p>
        )}
        {errors._form && (
          <p role="alert" className="mb-4 rounded-xl bg-error-container px-4 py-3 font-body-md text-body-md text-on-error-container">
            {errors._form}
          </p>
        )}
        {tab === 'details' && <DetailsTab {...tabProps} />}
        {tab === 'itinerary' && <ItineraryTab {...tabProps} expandToken={expandToken} />}
        {tab === 'gallery' && <GalleryTab {...tabProps} />}
        {tab === 'destinations' && <DestinationsTab {...tabProps} />}
        {tab === 'seo' && <SeoTab {...tabProps} />}
      </div>

      {/* Action bar: fixed to the viewport bottom (main's bottom padding keeps the last fields clear of it). */}
      <div aria-hidden="true" className="h-6" />
      <div
        role="region"
        aria-label={t('actionsLabel')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-container-high bg-surface-container-lowest/95 shadow-[0_-8px_24px_-16px_rgba(43,43,43,0.25)] backdrop-blur-md lg:left-64"
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-2 px-4 py-2.5 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="hidden sm:inline-flex">
              <StatusBadge kind="content" status={form.status} />
            </span>
            <span className="min-w-0 truncate font-caption text-caption text-on-surface-variant" aria-live="polite">
              {dirty ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-secondary">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                  {t('unsaved')}
                </span>
              ) : state.tour ? (
                t('lastSaved', {
                  date: format.dateTime(new Date(state.tour.updatedAt), {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                })
              ) : (
                t('notSavedYet')
              )}
            </span>
          </div>
          {!isNew && dirty && state.tour && (
            <IconButton icon="undo" variant="ghost" label={t('discard')} onClick={() => void discard()} disabled={saving || deleting} />
          )}
          {!isNew && (
            <IconButton
              icon="content_copy"
              variant="ghost"
              label={t('duplicate')}
              onClick={() => router.push(`/admin/tours/new?duplicate=${id}`)}
              disabled={saving || deleting}
            />
          )}
          {!isNew && (
            <IconButton icon="delete" variant="danger" label={t('delete')} onClick={() => void remove()} disabled={deleting} />
          )}
          {previewHref ? (
            <Button href={previewHref} external variant="ghost" icon="open_in_new" aria-label={t('previewLabel')} title={t('previewLabel')}>
              <span className="hidden md:inline">{t('preview')}</span>
            </Button>
          ) : (
            <span title={t('previewUnavailable')} className="hidden md:inline-flex">
              <Button variant="ghost" icon="visibility_off" disabled>
                {t('preview')}
              </Button>
            </span>
          )}
          <Button
            variant="secondary"
            icon={published ? STATUS_ICONS.unpublish.icon : STATUS_ICONS.publish.icon}
            loading={statusPending}
            disabled={saving}
            onClick={() => void changeStatus(published ? 'draft' : 'published')}
            aria-label={published ? t('unpublish') : dirty || isNew ? t('saveAndPublish') : t('publish')}
          >
            <span className="hidden sm:inline">
              {published ? t('unpublish') : dirty || isNew ? t('saveAndPublish') : t('publish')}
            </span>
          </Button>
          <Button
            variant="primary"
            icon="save"
            loading={saving}
            disabled={!dirty && !isNew}
            onClick={() => void save()}
            title={t('saveShortcut')}
          >
            {isNew ? t('create') : t('save')}
          </Button>
        </div>
      </div>
    </>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { Switch } from '@/components/admin/kit/form/Switch'
import { TextArea } from '@/components/admin/kit/form/TextArea'
import { TextField } from '@/components/admin/kit/form/TextField'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { humanizeSlot, settingsApi } from '@/components/admin/settings/settingsApi'
import type { AdminMediaRef, AdminSettings } from '@/lib/api/types'
import { Icon } from '@/components/ui/Icon'
import { useAdminMutation, useAdminQuery } from '@/lib/admin/hooks'
import { useUnsavedChanges } from '@/lib/admin/unsaved'
import { useUrlParam } from '@/lib/admin/url-state'
import { overrideProblem, type JsonObject, type ListItemOverride, type OverrideProblem } from '@/lib/page-content/merge'
import {
  PAGE_CONTENT_PAGES,
  pageById,
  pageGroups,
  type PageContentGroup,
  type PageContentPage,
} from '@/lib/page-content/registry'
import { cn } from '@/lib/utils'
import { ListEditor, listFieldId } from './ListEditor'
import { listFromEntry, listProblems, listToOverride, type EditItem, type ListProblem } from './listState'
import { imagesFrom, imagesPayload, pageSlots, type SlotImages } from './pageImages'
import {
  fieldLabel,
  humanizeId,
  loadDefaults,
  pageContentApi,
  type AdminPageContent,
  type PageContentEntry,
} from './pageContentApi'

const DEFAULT_PAGE = PAGE_CONTENT_PAGES[0]!

/** Long or multi-line defaults get a textarea. */
const isLong = (text: string) => text.length > 90 || text.includes('\n')

/**
 * /admin/page-content — edit the website's static page copy (headings, paragraphs, quotes, legal text).
 * The JSON files stay the defaults; only changed texts are stored (API /page-content) and merged by the site.
 * Pick a page on the left (`?page=`); every visited page's form stays mounted so unsaved edits survive.
 */
export function PageContentScreen() {
  const t = useTranslations('adminContent.pageContent')
  const param = useUrlParam('page')
  const active = pageById(param.value) ?? DEFAULT_PAGE
  const query = useAdminQuery(['page-content'], (signal) => pageContentApi.get(signal))
  // Page photos live in settings.pageImages (also editable in Settings → Page images).
  const settings = useAdminQuery(['settings'], (signal) => settingsApi.get(signal))
  const setSettings = settings.setData
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set([active.id]))
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const setData = query.setData

  // Mount a page's form the first time it is opened (adjusting state during render, not in an effect).
  if (!visited.has(active.id)) setVisited(new Set([...visited, active.id]))

  const onDirtyChange = useCallback(
    (id: string, value: boolean) => setDirty((prev) => (Boolean(prev[id]) === value ? prev : { ...prev, [id]: value })),
    [],
  )
  const onSaved = useCallback((next: AdminPageContent) => setData(next), [setData])
  const onSettingsSaved = useCallback((next: AdminSettings) => setSettings(next), [setSettings])

  const select = (page: PageContentPage) => {
    param.set(page.id === DEFAULT_PAGE.id ? null : page.id)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() =>
        document.getElementById('page-content-panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
      )
    }
  }

  const changedCount = (page: PageContentPage) => {
    const entry = query.data?.items.find((e) => e.namespace === page.namespace && e.locale === 'en')
    return entry ? Object.keys(entry.values).length + entry.hidden.length : 0
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-6">
        <nav aria-label={t('pagesLabel')} className="min-w-0 lg:sticky lg:top-20">
          <ul className="no-scrollbar relative -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
            {PAGE_CONTENT_PAGES.map((page) => {
              const current = page.id === active.id
              return (
                <li key={page.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => select(page)}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left font-body-md text-body-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      current
                        ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
                    )}
                  >
                    <Icon name={page.icon} className={cn('text-[18px]', current ? 'text-secondary' : '')} />
                    <span className="flex-1">{t(`pages.${page.id}` as Parameters<typeof t>[0])}</span>
                    {dirty[page.id] ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" title={t('unsaved')}>
                        <span className="sr-only">{t('unsaved')}</span>
                      </span>
                    ) : changedCount(page) > 0 ? (
                      <span className="font-caption text-caption text-on-surface-variant" title={t('changedTitle')}>
                        {changedCount(page)}
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div id="page-content-panel" className="min-w-0 scroll-mt-20">
          {query.error && !query.data ? (
            <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
          ) : settings.error && !settings.data ? (
            <ErrorPanel error={settings.error} onRetry={() => void settings.refetch()} />
          ) : !query.data || !settings.data ? (
            <LoadingPanel variant="form" rows={8} />
          ) : (
            PAGE_CONTENT_PAGES.filter((p) => visited.has(p.id)).map((page) => (
              <div key={page.id} hidden={page.id !== active.id}>
                <PageEditor
                  page={page}
                  entry={query.data?.items.find((e) => e.namespace === page.namespace && e.locale === 'en')}
                  settings={settings.data as AdminSettings}
                  onSettingsSaved={onSettingsSaved}
                  onSaved={onSaved}
                  onDirtyChange={onDirtyChange}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

// ------------------------------------------------------------------------------------------------ one page

interface PageEditorProps {
  page: PageContentPage
  /** Stored overrides of the page's namespace (several pages can share one, e.g. privacy + terms). */
  entry: PageContentEntry | undefined
  onSaved: (data: AdminPageContent) => void
  /** Settings (page photos) — the PUT response after saving photos is passed back. */
  settings: AdminSettings
  onSettingsSaved: (settings: AdminSettings) => void
  onDirtyChange: (pageId: string, dirty: boolean) => void
}

interface FormState {
  values: Record<string, string>
  hidden: string[]
  /** Editable lists by message path. */
  lists: Record<string, EditItem[]>
  /** Page photos by pageImages slot. */
  images: SlotImages
}

function PageEditor(props: PageEditorProps) {
  const { page } = props
  const [defaults, setDefaults] = useState<JsonObject | null>(null)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    loadDefaults(page.namespace)
      .then((d) => !cancelled && setDefaults(d))
      .catch((err: unknown) => !cancelled && setLoadError(err instanceof Error ? err : new Error(String(err))))
    return () => {
      cancelled = true
    }
  }, [page.namespace])

  if (loadError) return <ErrorPanel error={loadError} />
  if (!defaults) return <LoadingPanel variant="form" rows={8} />
  return <PageForm {...props} defaults={defaults} />
}

function stateFrom(
  groups: PageContentGroup[],
  entry: PageContentEntry | undefined,
  settings: AdminSettings,
): FormState {
  const values: Record<string, string> = {}
  for (const field of groups.flatMap((g) => g.fields)) values[field.path] = entry?.values[field.path] ?? field.text
  const hideable = groups.flatMap((g) => g.hideable)
  const lists: Record<string, EditItem[]> = {}
  for (const g of groups) if (g.list) lists[g.list.path] = listFromEntry(g.list, entry)
  const images = imagesFrom(settings, pageSlots(groups, lists))
  return { values, hidden: (entry?.hidden ?? []).filter((p) => hideable.includes(p)).sort(), lists, images }
}

function PageForm({
  page,
  defaults,
  entry,
  settings,
  onSaved,
  onSettingsSaved,
  onDirtyChange,
}: PageEditorProps & { defaults: JsonObject }) {
  const t = useTranslations('adminContent.pageContent')
  const groups = useMemo(() => pageGroups(page, defaults), [page, defaults])
  const fields = useMemo(() => groups.flatMap((g) => g.fields), [groups])
  const hideable = useMemo(() => groups.flatMap((g) => g.hideable), [groups])
  const listModels = useMemo(() => groups.flatMap((g) => (g.list ? [g.list] : [])), [groups])

  const [form, setForm] = useState<FormState>(() => stateFrom(groups, entry, settings))
  const [baseline, setBaseline] = useState(() => JSON.stringify(stateFrom(groups, entry, settings)))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const dirty = JSON.stringify(form) !== baseline

  const mutation = useAdminMutation(
    async (
      body: Parameters<typeof pageContentApi.save>[1],
      photos: Parameters<typeof settingsApi.pageImages>[0] | null,
    ) => {
      const content = await pageContentApi.save(page.namespace, body)
      const nextSettings = photos ? await settingsApi.pageImages(photos) : settings
      return { content, settings: nextSettings }
    },
    {
      successToast: t('saved'),
      onSuccess: (result) => {
        const saved = result.content.items.find((e) => e.namespace === page.namespace && e.locale === 'en')
        const next = stateFrom(groups, saved, result.settings)
        setForm(next)
        setBaseline(JSON.stringify(next))
        setErrors({})
        onSaved(result.content)
        if (result.settings !== settings) onSettingsSaved(result.settings)
      },
    },
  )
  useUnsavedChanges(dirty && !mutation.pending)
  useEffect(() => onDirtyChange(page.id, dirty), [dirty, onDirtyChange, page.id])

  const describe = (problem: OverrideProblem | ListProblem): string => {
    if (problem.kind === 'braces') return t('errors.braces')
    if (problem.kind === 'required') return t('errors.required')
    return t(`errors.${problem.kind}`, { tokens: problem.tokens.join(' ') })
  }
  const problemText = (original: string, text: string): string | null => {
    const problem = overrideProblem(original, text)
    return problem ? describe(problem) : null
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    for (const field of fields) {
      const text = form.values[field.path] ?? ''
      if (text.trim() === '' || text === field.text) continue
      const problem = problemText(field.text, text)
      if (problem) found[field.path] = problem
    }
    for (const model of listModels) {
      for (const [key, problem] of Object.entries(listProblems(model, form.lists[model.path] ?? []))) {
        found[key] = describe(problem)
      }
    }
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      setQuery('')
      requestAnimationFrame(() => {
        const [listPath, itemKey, itemField] = first.split('|')
        const el = document.getElementById(
          itemField ? listFieldId(page.id, listPath!, itemKey!, itemField) : fieldId(page.id, first),
        )
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        el?.focus({ preventScroll: true })
      })
      return
    }

    // Keep the namespace's other overrides (another page may share it), replace this page's.
    const own = new Set(fields.map((f) => f.path))
    const ownList = (path: string) => listModels.some((m) => path.startsWith(`${m.path}.`))
    const values = Object.fromEntries(
      Object.entries(entry?.values ?? {}).filter(([path]) => !own.has(path) && !ownList(path)),
    )
    for (const field of fields) {
      const text = form.values[field.path] ?? ''
      if (text.trim() !== '' && text !== field.text) values[field.path] = text
    }
    const hidden = [...(entry?.hidden ?? []).filter((p) => !hideable.includes(p)), ...form.hidden]
    const lists: Record<string, ListItemOverride[]> = Object.fromEntries(
      Object.entries(entry?.lists ?? {}).filter(([path]) => !listModels.some((m) => m.path === path)),
    )
    for (const model of listModels) {
      const override = listToOverride(model, form.lists[model.path] ?? [])
      if (override) lists[model.path] = override
    }
    const initial = (JSON.parse(baseline) as FormState).images
    const photos = imagesPayload(settings, initial, form.images, groups, form.lists)
    void mutation.mutate({ values, hidden, lists }, photos)
  }

  const discard = () => {
    setForm(JSON.parse(baseline) as FormState)
    setErrors({})
  }

  const setValue = (path: string, text: string) => {
    setForm((f) => ({ ...f, values: { ...f.values, [path]: text } }))
    if (errors[path]) setErrors(({ [path]: _removed, ...rest }) => rest)
  }

  const setList = (path: string, items: EditItem[]) => {
    setForm((f) => ({ ...f, lists: { ...f.lists, [path]: items } }))
    if (Object.keys(errors).some((k) => k.startsWith(`${path}|`))) {
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(`${path}|`))))
    }
  }

  const setImage = (slot: string, image: AdminMediaRef | null) =>
    setForm((f) => ({ ...f, images: { ...f.images, [slot]: image } }))

  const setShown = (path: string, shown: boolean) =>
    setForm((f) => ({ ...f, hidden: shown ? f.hidden.filter((p) => p !== path) : [...f.hidden, path].sort() }))

  const q = query.trim().toLowerCase()
  const matches = (path: string, original: string) =>
    !q ||
    original.toLowerCase().includes(q) ||
    (form.values[path] ?? '').toLowerCase().includes(q) ||
    path.toLowerCase().includes(q)

  const changed =
    fields.filter((f) => form.values[f.path] !== f.text && (form.values[f.path] ?? '').trim() !== '').length +
    listModels.filter((m) => listToOverride(m, form.lists[m.path] ?? []) !== null).length
  const sectionLabel = (id: string) =>
    t.has(`sections.${id}` as Parameters<typeof t>[0]) ? t(`sections.${id}` as Parameters<typeof t>[0]) : humanizeId(id)

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4" id={`page-content-${page.id}`}>
      <Card className="min-w-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <h2 className="font-headline-sm text-headline-sm text-primary">{t(`pages.${page.id}` as Parameters<typeof t>[0])}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t.has(`notes.${page.id}` as Parameters<typeof t>[0]) ? t(`notes.${page.id}` as Parameters<typeof t>[0]) : t('intro')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href={page.href} external variant="secondary" size="sm" icon="open_in_new">
              {t('viewPage')}
            </Button>
            <Button href="/admin/settings?section=pageImages" variant="ghost" size="sm" icon="image">
              {t('editPhotos')}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <TextField
            label={t('search')}
            hideLabel
            icon="search"
            type="search"
            value={query}
            placeholder={t('searchPlaceholder')}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {groups.map((group) => {
        const visibleFields = group.fields.filter((f) => matches(f.path, f.text))
        const listItems = group.list ? (form.lists[group.list.path] ?? []) : []
        const listMatches =
          !q || listItems.some((item) => Object.values(item.values).some((v) => v.toLowerCase().includes(q)))
        if (q && visibleFields.length === 0 && !(group.list && listMatches)) return null
        return (
          <Card
            key={group.key}
            title={group.heading ?? sectionLabel(group.sectionId)}
            headingLevel={3}
            className="min-w-0"
          >
            <div className="flex flex-col gap-4">
              {!q && group.images && group.images.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.images.map((image) => (
                    <ImageField
                      key={image.slot}
                      label={t('photo', { name: humanizeSlot(image.slot) })}
                      value={form.images[image.slot] ?? null}
                      onChange={(ref) => setImage(image.slot, ref)}
                      aspect={image.aspect ?? 'landscape'}
                      folder="settings"
                    />
                  ))}
                </div>
              )}
              {!q &&
                group.hideable.map((path) => {
                  const shown = !form.hidden.includes(path)
                  return (
                    <Switch
                      key={path}
                      checked={shown}
                      onCheckedChange={(value) => setShown(path, value)}
                      label={t('show', { part: fieldLabel(path, group.roots) || sectionLabel(group.sectionId) })}
                      description={shown ? t('showOn') : t('showOff')}
                    />
                  )
                })}
              {visibleFields.map((field) => {
                const value = form.values[field.path] ?? ''
                const isChanged = value !== field.text && value.trim() !== ''
                const hiddenByParent = form.hidden.some((h) => field.path === h || field.path.startsWith(`${h}.`))
                const common = {
                  id: fieldId(page.id, field.path),
                  label: fieldLabel(field.path, group.roots),
                  value,
                  placeholder: field.text,
                  error: errors[field.path] ?? null,
                  disabled: hiddenByParent,
                  hint: value.trim() === '' ? t('emptyHint') : undefined,
                  labelAside: isChanged ? (
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary-fixed px-2 py-0.5 font-caption text-caption text-on-secondary-fixed">
                        {t('changed')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setValue(field.path, field.text)}
                        className="font-caption text-caption text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {t('reset')}
                      </button>
                    </span>
                  ) : undefined,
                }
                return isLong(field.text) ? (
                  <TextArea
                    key={field.path}
                    {...common}
                    rows={Math.min(8, Math.max(3, Math.ceil(field.text.length / 90)))}
                    onChange={(e) => setValue(field.path, e.target.value)}
                  />
                ) : (
                  <TextField key={field.path} {...common} onChange={(e) => setValue(field.path, e.target.value)} />
                )
              })}
              {group.list && listMatches && (
                <ListEditor
                  model={group.list}
                  items={listItems}
                  onChange={(items) => setList(group.list!.path, items)}
                  errors={errors}
                  idPrefix={page.id}
                  images={form.images}
                  onImage={setImage}
                />
              )}
            </div>
          </Card>
        )
      })}

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-surface-container bg-surface-container-lowest/95 px-4 py-3 shadow-sm backdrop-blur">
        <span className="mr-auto font-caption text-caption text-on-surface-variant" aria-live="polite">
          {dirty ? t('unsavedChanges') : t('changedCount', { count: changed })}
        </span>
        <Button variant="ghost" onClick={discard} disabled={!dirty || mutation.pending}>
          {t('discard')}
        </Button>
        <Button type="submit" variant="primary" icon="save" loading={mutation.pending} disabled={!dirty}>
          {t('save')}
        </Button>
      </div>
    </form>
  )
}

const fieldId = (pageId: string, path: string) => `pc-${pageId}-${path.replace(/[^A-Za-z0-9_-]/g, '-')}`

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Button } from '@/components/admin/kit/Button'
import { Card } from '@/components/admin/kit/Card'
import { useConfirm } from '@/components/admin/kit/ConfirmDialog'
import { DateField } from '@/components/admin/kit/form/DateField'
import { SelectField } from '@/components/admin/kit/form/SelectField'
import { SlugField } from '@/components/admin/kit/form/SlugField'
import { Switch } from '@/components/admin/kit/form/Switch'
import { TagInput } from '@/components/admin/kit/form/TagInput'
import { TextField } from '@/components/admin/kit/form/TextField'
import { LocaleTabs, TranslatableText } from '@/components/admin/kit/LocaleTabs'
import { ImageField } from '@/components/admin/kit/media/ImageField'
import { PageHeader } from '@/components/admin/kit/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/admin/kit/Panels'
import { StatusBadge } from '@/components/admin/kit/StatusBadge'
import { Icon } from '@/components/ui/Icon'
import { parseFieldIssues } from '@/lib/admin/errors'
import { invalidateAdminQueries, useAdminErrorMessage, useAdminMutation, useAdminQuery } from '@/lib/admin/hooks'
import { ADMIN_LOCALES, localeErrors, localeFromPath, type AdminLocale } from '@/lib/admin/translatable'
import { skipUnsavedCheck, useUnsavedChanges } from '@/lib/admin/unsaved'
import { publicEnv } from '@/lib/env'
import type { AdminBlogPost } from '@/lib/api/types'
import { useAdminSession } from '../shell/AdminSession'
import { ArticleMarkdownEditor } from './ArticleMarkdownEditor'
import {
  blogApi,
  emptyBlogForm,
  loadBlogTaxonomy,
  publicPostPath,
  toBlogForm,
  toBlogWrite,
  type BlogCategoryOption,
  type BlogForm,
} from './blogApi'

const NEW_CATEGORY = '__new__'
type Rec = Record<AdminLocale, string>

/** /admin/blog/new and /admin/blog/[id] — loads the post (or starts empty) and renders the editor. */
export function BlogEditorScreen({ id }: { id: string }) {
  const t = useTranslations('adminLibrary.blog')
  const isNew = id === 'new'
  const { user } = useAdminSession()
  const post = useAdminQuery(['blogPost', id], (signal) => blogApi.get(id, signal), [], {
    enabled: !isNew,
    keepPreviousData: false,
  })
  const crumbs = [{ label: t('title'), href: '/admin/blog' }]

  if (!isNew && post.error && !post.data) {
    return (
      <>
        <PageHeader title={t('editor.editTitle')} breadcrumbs={[...crumbs, { label: t('editor.editTitle') }]} />
        {post.error.isNotFound ? (
          <EmptyPanel
            variant="card"
            icon="search_off"
            title={t('editor.notFoundTitle')}
            body={t('editor.notFoundBody')}
            action={
              <Button href="/admin/blog" icon="arrow_back">
                {t('editor.backToList')}
              </Button>
            }
          />
        ) : (
          <ErrorPanel error={post.error} onRetry={() => void post.refetch()} />
        )}
      </>
    )
  }
  if ((!isNew && !post.data) || (isNew && !user)) {
    return (
      <>
        <PageHeader title={isNew ? t('editor.newTitle') : t('editor.editTitle')} breadcrumbs={crumbs} />
        <LoadingPanel variant="form" rows={8} />
      </>
    )
  }
  return (
    <BlogEditor
      key={post.data?.id ?? 'new'}
      post={isNew ? null : (post.data ?? null)}
      defaultAuthor={user?.name ?? ''}
    />
  )
}

function BlogEditor({ post, defaultAuthor }: { post: AdminBlogPost | null; defaultAuthor: string }) {
  const t = useTranslations('adminLibrary.blog')
  const te = useTranslations('adminLibrary.blog.editor')
  const tl = useTranslations('admin.kit.locales')
  const format = useFormatter()
  const describe = useAdminErrorMessage()
  const confirm = useConfirm()
  const router = useRouter()
  const [saved, setSaved] = useState<AdminBlogPost | null>(post)
  const [form, setForm] = useState<BlogForm>(() => (post ? toBlogForm(post) : emptyBlogForm(defaultAuthor)))
  const [baseline, setBaseline] = useState(() => JSON.stringify(post ? toBlogForm(post) : emptyBlogForm(defaultAuthor)))
  const [locale, setLocale] = useState<AdminLocale>('en')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusTick, setFocusTick] = useState(0)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const taxonomy = useAdminQuery(['blog', 'taxonomy'], (signal) => loadBlogTaxonomy(signal))
  const categories = taxonomy.data?.categories ?? []
  const dirty = JSON.stringify(form) !== baseline

  const save = useAdminMutation(
    () => (saved ? blogApi.update(saved.id, toBlogWrite(form)) : blogApi.create(toBlogWrite(form))),
    {
      successToast: saved ? te('saved') : te('created'),
      errorToast: (err) => (err.isConflict ? te('conflict') : describe(err)),
      onError: (err) => {
        const fieldErrors = err.isValidationError
          ? err.fieldErrors
          : err.isConflict
            ? parseFieldIssues(err.details)
            : {}
        setErrors(fieldErrors)
        const first = Object.keys(fieldErrors)[0]
        const loc = first ? localeFromPath(first) : undefined
        if (loc) setLocale(loc)
        if (first) setFocusTick((n) => n + 1)
      },
      onSuccess: (result) => {
        setErrors({})
        invalidateAdminQueries(['blog'])
        if (!saved) {
          skipUnsavedCheck()
          router.replace(`/admin/blog/${result.id}`)
          return
        }
        const next = toBlogForm(result)
        setSaved(result)
        setForm(next)
        setBaseline(JSON.stringify(next))
      },
    },
  )
  useUnsavedChanges(dirty && !save.pending)

  const remove = useAdminMutation(() => blogApi.remove(saved?.id ?? ''), {
    successToast: te('deleted'),
    invalidate: ['blog'],
    onSuccess: () => {
      skipUnsavedCheck()
      router.push('/admin/blog')
    },
  })

  // After a failed save: focus the first invalid control (once the right locale is shown).
  useEffect(() => {
    if (!focusTick) return
    const el = document.querySelector<HTMLElement>('#blog-editor [aria-invalid="true"]')
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el?.focus({ preventScroll: true })
  }, [focusTick])

  const clearError = (...paths: string[]) => {
    if (!paths.some((p) => Object.keys(errors).some((k) => k === p || k.startsWith(`${p}.`)))) return
    setErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !paths.some((p) => k === p || k.startsWith(`${p}.`)))),
    )
  }
  const set = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    clearError(key)
  }
  const setText = (
    key: 'title' | 'excerpt' | 'content' | 'category' | 'seoTitle' | 'seoDescription',
    value: Partial<Rec>,
  ) => {
    setForm((f) => ({ ...f, [key]: { ...f[key], ...value } }))
    clearError(key)
  }

  const pickCategory = (value: string) => {
    if (value === NEW_CATEGORY) {
      setCreatingCategory(true)
      setForm((f) => ({ ...f, categorySlug: '', category: { en: '', zh: '', de: '' } }))
      return
    }
    setCreatingCategory(false)
    const option = categories.find((c) => c.slug === value)
    setForm((f) => ({ ...f, categorySlug: value, category: option ? { ...option.label } : f.category }))
    clearError('categorySlug', 'category')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void save.mutate()
  }

  const onDelete = async () => {
    if (!saved) return
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody', { title: saved.title.en ?? saved.slug }),
      confirmLabel: t('delete'),
      tone: 'danger',
      icon: 'delete',
    })
    if (ok) await remove.mutate()
  }

  const translatables = [form.title, form.excerpt, form.content, form.category, form.seoTitle, form.seoDescription]
  const filled = Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, translatables.some((v) => v[l].trim() !== '')]),
  ) as Record<AdminLocale, boolean>
  const errorLocales = Object.fromEntries(
    ADMIN_LOCALES.map((l) => [l, Object.keys(errors).some((p) => localeFromPath(p) === l)]),
  ) as Record<AdminLocale, boolean>
  const err = (field: string) => localeErrors(errors, field)

  const knownCategory = categories.some((c) => c.slug === form.categorySlug)
  const showNewCategory =
    creatingCategory || (form.categorySlug !== '' && !knownCategory && taxonomy.data !== undefined)
  const categoryOptions = [
    ...categories.map((c: BlogCategoryOption) => ({
      value: c.slug,
      label: `${c.label.en}${c.count ? ` (${c.count})` : ''}`,
    })),
    { value: NEW_CATEGORY, label: te('newCategory') },
  ]

  const titleText = saved ? saved.title.en || saved.slug : te('newTitle')
  const isPublished = saved?.status === 'published'
  const localeName = tl(`${locale}.name`)
  const snippetTitle =
    form.seoTitle[locale] || form.seoTitle.en || form.title[locale] || form.title.en || te('seo.snippetFallbackTitle')
  const snippetDescription =
    form.seoDescription[locale] ||
    form.seoDescription.en ||
    (form.excerpt[locale] || form.excerpt.en).slice(0, 160) ||
    te('seo.snippetFallbackDescription')

  return (
    <form id="blog-editor" noValidate onSubmit={submit}>
      <PageHeader
        title={titleText}
        breadcrumbs={[{ label: t('title'), href: '/admin/blog' }, { label: saved ? te('editTitle') : te('newTitle') }]}
        meta={saved ? <StatusBadge kind="content" status={saved.status} size="md" /> : undefined}
        description={
          saved
            ? te('lastSaved', {
                date: format.dateTime(new Date(saved.updatedAt), {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })
            : te('newDescription')
        }
        actions={
          <>
            {saved && isPublished && (
              <Button href={publicPostPath(saved.slug)} external variant="ghost" icon="open_in_new">
                {te('viewOnSite')}
              </Button>
            )}
            {saved && (
              <Button variant="dangerGhost" icon="delete" loading={remove.pending} onClick={() => void onDelete()}>
                {t('delete')}
              </Button>
            )}
          </>
        }
      />

      {/* sticky language + save bar */}
      <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-surface-container-high bg-surface-container-low/95 px-4 py-2.5 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <LocaleTabs value={locale} onChange={setLocale} filled={filled} errors={errorLocales} size="sm" />
        <p className="hidden min-w-0 flex-1 font-caption text-caption text-on-surface-variant md:block">
          {locale === 'en' ? te('editingEnglish') : te('editingTranslation', { language: localeName })}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <span className="hidden items-center gap-1 font-caption text-caption text-secondary sm:inline-flex">
              <Icon name="fiber_manual_record" filled className="text-[10px]" />
              {te('unsaved')}
            </span>
          )}
          {dirty && saved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setForm(toBlogForm(saved))
                setErrors({})
              }}
            >
              {te('discard')}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            icon="check"
            loading={save.pending}
            disabled={saved !== null && !dirty}
          >
            {saved ? te('save') : te('create')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="min-w-0" title={te('sections.article')} icon="article">
            <div className="flex flex-col gap-4">
              <TranslatableText
                label={te('fields.title')}
                locale={locale}
                value={form.title}
                onChange={(v) => setText('title', v)}
                required
                maxLength={200}
                counter
                error={err('title')}
              />
              <SlugField
                value={form.slug}
                onChange={(v) => set('slug', v)}
                source={form.title.en}
                prefix="/blog/"
                required
                error={errors.slug}
                auto={saved ? false : undefined}
              />
              <TranslatableText
                label={te('fields.excerpt')}
                hint={te('fields.excerptHint')}
                locale={locale}
                value={form.excerpt}
                onChange={(v) => setText('excerpt', v)}
                required
                multiline={3}
                maxLength={600}
                counter
                error={err('excerpt')}
              />
            </div>
          </Card>

          <Card className="min-w-0" title={te('sections.publishing')} icon="event_available">
            <div className="flex flex-col gap-4">
              <Switch
                checked={form.status === 'published'}
                onCheckedChange={(v) => set('status', v ? 'published' : 'draft')}
                label={te('fields.published')}
                description={form.status === 'published' ? te('fields.publishedOn') : te('fields.publishedOff')}
              />
              <DateField
                type="datetime-local"
                label={te('fields.publishedAt')}
                hint={te('fields.publishedAtHint')}
                value={form.publishedAt}
                onChange={(v) => set('publishedAt', v)}
                error={errors.publishedAt}
              />
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(v) => set('isFeatured', v)}
                label={te('fields.featured')}
                description={te('fields.featuredHint')}
              />
              <TextField
                label={te('fields.author')}
                value={form.authorName}
                maxLength={120}
                required
                error={errors.authorName}
                onChange={(e) => set('authorName', e.target.value)}
              />
              <div className="flex items-start gap-2 rounded-lg bg-surface-container-low px-3 py-2.5">
                <Icon name="schedule" className="mt-0.5 text-[18px] text-secondary" />
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {saved ? (
                    <>
                      <span className="font-semibold text-on-surface">
                        {te('readingTime', { minutes: saved.readingTime })}
                      </span>
                      <br />
                      <span className="font-caption text-caption">{te('readingTimeHint')}</span>
                    </>
                  ) : (
                    te('readingTimeNew')
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card
          className="min-w-0"
          title={te('sections.content')}
          icon="edit_note"
          description={te('contentDescription')}
        >
          <ArticleMarkdownEditor
            label={te('fields.content', { language: localeName })}
            value={form.content[locale]}
            onChange={(v) => setText('content', { [locale]: v })}
            maxLength={100_000}
            lang={locale}
            altLocale={locale}
            required={locale === 'en'}
            error={err('content')[locale]}
            placeholder={locale === 'en' ? undefined : te('translatePlaceholder', { language: localeName })}
          />
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="min-w-0" title={te('sections.classification')} icon="sell">
            <div className="flex flex-col gap-4">
              <ImageField
                label={te('fields.cover')}
                hint={te('fields.coverHint')}
                value={form.cover}
                onChange={(v) => set('cover', v)}
                aspect="video"
                folder="blog"
                error={errors.coverId}
              />
              <SelectField
                label={te('fields.category')}
                required
                placeholder={taxonomy.loading ? te('loadingCategories') : te('chooseCategory')}
                value={showNewCategory ? NEW_CATEGORY : form.categorySlug}
                options={categoryOptions}
                onValueChange={(v) => pickCategory(v)}
                error={showNewCategory ? undefined : (errors.categorySlug ?? null)}
              />
              <TranslatableText
                label={showNewCategory ? te('fields.categoryNewLabel') : te('fields.categoryLabel')}
                hint={showNewCategory ? te('fields.categoryNewHint') : te('fields.categoryLabelHint')}
                locale={locale}
                value={form.category}
                onChange={(v) => setText('category', v)}
                required
                maxLength={80}
                error={err('category')}
              />
              {showNewCategory && (
                <SlugField
                  label={te('fields.categorySlug')}
                  value={form.categorySlug}
                  onChange={(v) => set('categorySlug', v)}
                  source={form.category.en}
                  prefix="/blog?category="
                  required
                  error={errors.categorySlug}
                />
              )}
              <TagInput
                label={te('fields.tags')}
                value={form.tags}
                onChange={(v) => set('tags', v)}
                suggestions={taxonomy.data?.tags}
                max={12}
                maxLength={40}
                error={errors.tags ?? Object.entries(errors).find(([k]) => k.startsWith('tags.'))?.[1]}
              />
            </div>
          </Card>

          <Card
            className="min-w-0"
            title={te('sections.seo')}
            icon="travel_explore"
            description={te('seo.description')}
          >
            <div className="flex flex-col gap-4">
              <TranslatableText
                label={te('seo.title')}
                locale={locale}
                value={form.seoTitle}
                onChange={(v) => setText('seoTitle', v)}
                maxLength={70}
                counter
                placeholder={form.title[locale] || form.title.en}
                error={err('seoTitle')}
              />
              <TranslatableText
                label={te('seo.metaDescription')}
                locale={locale}
                value={form.seoDescription}
                onChange={(v) => setText('seoDescription', v)}
                multiline={3}
                maxLength={170}
                counter
                placeholder={(form.excerpt[locale] || form.excerpt.en).slice(0, 160)}
                error={err('seoDescription')}
              />
              <div
                className="rounded-lg border border-surface-container-high bg-surface-container-lowest p-3"
                aria-label={te('seo.previewLabel')}
                role="group"
              >
                <p className="mb-1 font-caption text-[11px] uppercase tracking-wider text-on-surface-variant">
                  {te('seo.previewLabel')}
                </p>
                <p className="truncate font-body-md text-[12px] text-on-surface-variant">
                  {publicEnv.siteUrl.replace(/^https?:\/\//, '')}
                  {locale === 'en' ? '' : `/${locale}`}
                  {publicPostPath(form.slug || 'slug')}
                </p>
                <p className="line-clamp-1 font-body-md text-[17px] leading-6 text-primary">{snippetTitle}</p>
                <p className="line-clamp-2 font-body-md text-[13px] leading-5 text-on-surface-variant">
                  {snippetDescription}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}

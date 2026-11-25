'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BlogCard } from '@/components/cards/BlogCard'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Icon } from '@/components/ui/Icon'
import type { BlogCard as BlogCardDto, BlogCategoryCount } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 6
const ALL = 'all'

const normalise = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim()

const haystack = (post: BlogCardDto) =>
  normalise([post.title, post.excerpt, post.category.label, post.authorName, ...post.tags].join(' '))

export interface BlogExplorerProps {
  posts: BlogCardDto[]
  categories: BlogCategoryCount[]
  /** Shown in the hero card above — left out of the unfiltered grid. */
  featuredSlug: string | null
}

interface ViewProps extends BlogExplorerProps {
  category: string
  query: string
  visible: number
  onCategory?: (slug: string) => void
  onQuery?: (value: string) => void
  onReset?: () => void
  onMore?: () => void
  gridRef?: Ref<HTMLElement>
  listRef?: Ref<HTMLUListElement>
}

/** Writes ?category= / ?q= into the address bar without a navigation (the page stays static). */
function syncUrl(category: string, query: string) {
  const url = new URL(window.location.href)
  if (category && category !== ALL) url.searchParams.set('category', category)
  else url.searchParams.delete('category')
  if (query.trim()) url.searchParams.set('q', query.trim())
  else url.searchParams.delete('q')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

/**
 * Journal filter bar (category chips with counts + search) and the article grid with "load more".
 * Category and search are mirrored in the URL (?category=wildlife&q=leopard) so filtered views can be shared.
 */
export function BlogExplorer(props: BlogExplorerProps) {
  const searchParams = useSearchParams()
  const known = new Set(props.categories.map((c) => c.slug))
  const initialCategory = searchParams.get('category') ?? ALL
  const [category, setCategory] = useState(known.has(initialCategory) ? initialCategory : ALL)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const gridRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const focusIndex = useRef<number | null>(null)

  // After "load more", move keyboard focus to the first newly revealed article.
  useEffect(() => {
    const index = focusIndex.current
    if (index === null) return
    focusIndex.current = null
    listRef.current?.querySelector<HTMLAnchorElement>(`li[data-index="${index}"] a`)?.focus()
  }, [visible])

  const bringGridIntoView = () => {
    const grid = gridRef.current
    if (grid && grid.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      grid.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
  }

  return (
    <ExplorerView
      {...props}
      category={category}
      query={query}
      visible={visible}
      gridRef={gridRef}
      listRef={listRef}
      onCategory={(slug) => {
        setCategory(slug)
        setVisible(PAGE_SIZE)
        syncUrl(slug, query)
        bringGridIntoView()
      }}
      onQuery={(value) => {
        setQuery(value)
        setVisible(PAGE_SIZE)
        syncUrl(category, value)
      }}
      onReset={() => {
        setCategory(ALL)
        setQuery('')
        setVisible(PAGE_SIZE)
        syncUrl(ALL, '')
      }}
      onMore={() => {
        focusIndex.current = visible
        setVisible((v) => v + PAGE_SIZE)
      }}
    />
  )
}

/** Server-rendered stand-in (Suspense fallback while search params resolve): the unfiltered grid. */
export function BlogExplorerFallback(props: BlogExplorerProps) {
  return <ExplorerView {...props} category={ALL} query="" visible={PAGE_SIZE} />
}

function ExplorerView({
  posts,
  categories,
  featuredSlug,
  category,
  query,
  visible,
  onCategory,
  onQuery,
  onReset,
  onMore,
  gridRef,
  listRef,
}: ViewProps) {
  const t = useTranslations('blog')
  const term = normalise(query)

  const results = useMemo(() => {
    const filtered = posts.filter(
      (p) => (category === ALL || p.category.slug === category) && (!term || haystack(p).includes(term)),
    )
    const unfiltered = category === ALL && !term
    return unfiltered && featuredSlug ? filtered.filter((p) => p.slug !== featuredSlug) : filtered
  }, [posts, category, term, featuredSlug])

  const shown = results.slice(0, visible)

  const chip = (slug: string, label: ReactNode) => {
    const active = category === slug
    return (
      <button
        key={slug}
        type="button"
        aria-pressed={active}
        onClick={() => onCategory?.(slug)}
        className={cn(
          'tap-target relative shrink-0 rounded-full px-space-md py-2 font-label-md text-label-md uppercase tracking-wider transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container',
          active
            ? 'bg-primary text-on-primary shadow-sm'
            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high hover:text-primary',
        )}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="w-full">
      <section
        aria-label={t('filters.label')}
        className="z-30 w-full bg-surface-container py-space-md shadow-sm transition-all md:sticky md:top-20"
      >
        <Container>
          <div className="flex flex-col items-center justify-between gap-space-md xl:flex-row">
            <div
              role="group"
              aria-label={t('filters.label')}
              className="no-scrollbar relative flex w-full items-center gap-2 overflow-x-auto px-1 py-1 coarse:-my-1 coarse:py-2 xl:w-auto"
            >
              {chip(ALL, t('filters.all', { count: posts.length }))}
              {categories.map((c) => chip(c.slug, t('filters.category', { label: c.label, count: c.count })))}
            </div>
            <div className="relative w-full shrink-0 xl:w-80">
              <label htmlFor="journal-search" className="sr-only">
                {t('filters.searchLabel')}
              </label>
              <input
                id="journal-search"
                type="search"
                value={query}
                onChange={(event) => onQuery?.(event.target.value)}
                placeholder={t('filters.searchPlaceholder')}
                autoComplete="off"
                enterKeyHint="search"
                className="w-full rounded-xl bg-surface-container-lowest py-2 pl-10 pr-space-md font-body-md text-body-md text-on-surface shadow-sm placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 coarse:min-h-11"
              />
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
              />
            </div>
          </div>
        </Container>
      </section>

      <section
        ref={gridRef}
        aria-labelledby="journal-grid-title"
        className="w-full scroll-mt-20 bg-surface py-space-2xl md:scroll-mt-40 xl:scroll-mt-36"
      >
        <Container>
          <div className="mb-space-lg flex items-center justify-between">
            <div>
              <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary">
                {t('grid.eyebrow')}
              </span>
              <h2 id="journal-grid-title" className="mt-1 font-headline-lg text-headline-lg text-primary">
                {t('grid.title')}
              </h2>
            </div>
            <div className="hidden items-center gap-space-xs font-label-md text-label-md uppercase tracking-wider text-on-surface-variant sm:flex">
              <span>{t('grid.sortLabel')}</span>
              <span className="font-bold text-primary">{t('grid.sortValue')}</span>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {t('grid.results', { count: results.length })}
          </p>

          {shown.length > 0 ? (
            <ul ref={listRef} className="grid grid-cols-1 gap-gutter-lg md:grid-cols-2 lg:grid-cols-3">
              {shown.map((post, index) => (
                <li key={post.id} data-index={index} className="flex">
                  <BlogCard post={post} variant="list" className="w-full" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-space-2xl text-center">
              <Icon name="search_off" className="text-[48px] text-outline" />
              <h3 className="mt-space-xs font-headline-sm text-headline-sm text-primary">{t('empty.title')}</h3>
              <p className="mt-1 max-w-md font-body-md text-body-md text-on-surface-variant">{t('empty.body')}</p>
              <button
                type="button"
                onClick={() => onReset?.()}
                className="mt-space-md rounded-xl bg-surface-container-high px-space-md py-space-sm font-label-md text-label-md uppercase tracking-wider text-primary transition-colors hover:bg-surface-container-highest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('empty.reset')}
              </button>
            </div>
          )}

          {results.length > shown.length && (
            <div className="mt-space-2xl flex flex-col items-center gap-space-sm">
              <p className="font-caption text-caption text-on-surface-variant">
                {t('grid.showing', { shown: shown.length, total: results.length })}
              </p>
              <Button variant="soft" uppercase trailingIcon="expand_more" onClick={() => onMore?.()}>
                {t('grid.loadMore')}
              </Button>
            </div>
          )}
        </Container>
      </section>
    </div>
  )
}

import { adminApi, cleanQuery, unwrap } from '@/lib/admin/client'
import type { components } from '@/lib/api/schema'
import { compactOptional, compactRequired, toEditable, type AdminLocale } from '@/lib/admin/translatable'
import type { AdminBlogList, AdminBlogPost, AdminMediaRef } from '@/lib/api/types'

/** Typed calls for /api/v1/admin/blog + the editor's form model. */

export type BlogPostWrite = components['schemas']['BlogPostWriteInput']
export type BlogStatus = AdminBlogPost['status']

export const BLOG_PAGE_SIZE = 25

export interface BlogListFilters {
  q?: string
  status?: BlogStatus
  category?: string
  page?: number
  pageSize?: number
}

export const blogApi = {
  list: (filters: BlogListFilters, signal?: AbortSignal): Promise<AdminBlogList> =>
    unwrap(adminApi.GET('/api/v1/admin/blog', { params: { query: cleanQuery({ ...filters }) }, signal })),
  get: (id: string, signal?: AbortSignal): Promise<AdminBlogPost> =>
    unwrap(adminApi.GET('/api/v1/admin/blog/{id}', { params: { path: { id } }, signal })),
  create: (body: BlogPostWrite): Promise<AdminBlogPost> => unwrap(adminApi.POST('/api/v1/admin/blog', { body })),
  update: (id: string, body: BlogPostWrite): Promise<AdminBlogPost> =>
    unwrap(adminApi.PUT('/api/v1/admin/blog/{id}', { params: { path: { id } }, body })),
  setStatus: (id: string, status: BlogStatus): Promise<AdminBlogPost> =>
    unwrap(adminApi.PATCH('/api/v1/admin/blog/{id}/status', { params: { path: { id } }, body: { status } })),
  remove: (id: string): Promise<void> =>
    unwrap(adminApi.DELETE('/api/v1/admin/blog/{id}', { params: { path: { id } } })),
}

export interface BlogCategoryOption {
  slug: string
  /** Label per locale ('' = not translated). */
  label: Record<AdminLocale, string>
  count: number
}

export interface BlogTaxonomy {
  categories: BlogCategoryOption[]
  /** Tags used by published posts (suggestions). */
  tags: string[]
}

/**
 * Existing blog categories and tags: the public GET /api/v1/blog facets (published posts, one call per locale for the
 * translated labels) merged with the admin list (drafts, English labels).
 */
export async function loadBlogTaxonomy(signal?: AbortSignal): Promise<BlogTaxonomy> {
  const publicList = (locale: AdminLocale, pageSize: number) =>
    unwrap(adminApi.GET('/api/v1/blog', { params: { query: { locale, pageSize } }, signal }))
  const [en, zh, de, admin] = await Promise.all([
    publicList('en', 50),
    publicList('zh', 1)
      .then((r) => r.categories)
      .catch(() => []),
    publicList('de', 1)
      .then((r) => r.categories)
      .catch(() => []),
    blogApi.list({ pageSize: 100 }, signal),
  ])
  const map = new Map<string, BlogCategoryOption>()
  for (const c of en.categories) map.set(c.slug, { slug: c.slug, label: { en: c.label, zh: '', de: '' }, count: 0 })
  for (const [locale, list] of [
    ['zh', zh],
    ['de', de],
  ] as const) {
    for (const c of list) {
      const entry = map.get(c.slug)
      // The API falls back to English for untranslated labels — only keep real translations.
      if (entry && c.label !== entry.label.en) entry.label[locale] = c.label
    }
  }
  for (const post of admin.items) {
    const entry = map.get(post.categorySlug) ?? {
      slug: post.categorySlug,
      label: { en: post.categoryLabel, zh: '', de: '' },
      count: 0,
    }
    entry.count++
    map.set(post.categorySlug, entry)
  }
  const tags = new Map<string, string>()
  for (const post of en.items)
    for (const tag of post.tags) if (!tags.has(tag.toLowerCase())) tags.set(tag.toLowerCase(), tag)
  return {
    categories: [...map.values()].sort((a, b) => a.label.en.localeCompare(b.label.en)),
    tags: [...tags.values()].sort((a, b) => a.localeCompare(b)),
  }
}

/** Editing shape (every translatable as three strings, cover as a media ref, date as datetime-local text). */
export interface BlogForm {
  slug: string
  status: BlogStatus
  title: Record<AdminLocale, string>
  excerpt: Record<AdminLocale, string>
  content: Record<AdminLocale, string>
  cover: AdminMediaRef | null
  categorySlug: string
  category: Record<AdminLocale, string>
  tags: string[]
  authorName: string
  isFeatured: boolean
  /** 'YYYY-MM-DDTHH:mm' local time, '' = set automatically on first publish. */
  publishedAt: string
  seoTitle: Record<AdminLocale, string>
  seoDescription: Record<AdminLocale, string>
}

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO → value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local value → ISO (UTC) or null. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function emptyBlogForm(authorName: string): BlogForm {
  const blank = () => ({ en: '', zh: '', de: '' })
  return {
    slug: '',
    status: 'draft',
    title: blank(),
    excerpt: blank(),
    content: blank(),
    cover: null,
    categorySlug: '',
    category: blank(),
    tags: [],
    authorName,
    isFeatured: false,
    publishedAt: '',
    seoTitle: blank(),
    seoDescription: blank(),
  }
}

export function toBlogForm(post: AdminBlogPost): BlogForm {
  return {
    slug: post.slug,
    status: post.status,
    title: toEditable(post.title),
    excerpt: toEditable(post.excerpt),
    content: toEditable(post.content),
    cover: post.cover,
    categorySlug: post.categorySlug,
    category: toEditable(post.category),
    tags: [...post.tags],
    authorName: post.authorName,
    isFeatured: post.isFeatured,
    publishedAt: toLocalInput(post.publishedAt),
    seoTitle: toEditable(post.seoTitle),
    seoDescription: toEditable(post.seoDescription),
  }
}

/** Form → request body: required translatables keep `en` (so a blank one is reported), untranslated zh/de dropped. */
export function toBlogWrite(form: BlogForm): BlogPostWrite {
  return {
    slug: form.slug.trim(),
    status: form.status,
    title: compactRequired(form.title, ''),
    excerpt: compactRequired(form.excerpt, ''),
    content: compactRequired(form.content, ''),
    coverId: form.cover?.id ?? null,
    categorySlug: form.categorySlug.trim(),
    category: compactRequired(form.category, ''),
    tags: form.tags,
    authorName: form.authorName.trim(),
    isFeatured: form.isFeatured,
    publishedAt: fromLocalInput(form.publishedAt),
    seoTitle: compactOptional(form.seoTitle),
    seoDescription: compactOptional(form.seoDescription),
  }
}

/** Public URL of a post (English has no locale prefix). */
export const publicPostPath = (slug: string) => `/blog/${slug}`

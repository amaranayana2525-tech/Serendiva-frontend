#!/usr/bin/env node
/**
 * DEPRECATED fallback snapshot — writes the public API's English content to src/content/*.json so `npm run dev`
 * keeps rendering when the API is down (see src/content/README.md). Production never uses it unless CONTENT_FALLBACK=true.
 *
 *   npm run content:snapshot                          # API_URL / NEXT_PUBLIC_API_URL / http://localhost:4000
 *   npm run content:snapshot -- http://localhost:4105
 *
 * File names match the keys in src/lib/api/public.ts (settings, tours, tour.<slug>, faqs.<scope> …).
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'src', 'content')
const base = (
  process.argv[2] ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000'
).replace(/\/+$/, '')
const locale = 'en'

async function get(pathname, query = {}) {
  const url = new URL(`/api/v1${pathname}`, base)
  for (const [k, v] of Object.entries(query)) if (v !== undefined) url.searchParams.set(k, String(v))
  const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`${res.status} ${url.pathname}${url.search}`)
  return res.json()
}

async function all(pathname) {
  const first = await get(pathname, { locale, page: 1, pageSize: 50 })
  const items = [...first.items]
  for (let page = 2; page <= (first.meta?.totalPages ?? 1); page++)
    items.push(...(await get(pathname, { locale, page, pageSize: 50 })).items)
  return {
    ...first,
    items,
    meta: { ...first.meta, page: 1, pageSize: items.length || 50, totalPages: 1, total: items.length },
  }
}

const files = {}
const put = (key, data) => {
  files[key] = data
}

console.log(`[content] snapshot from ${base} (${locale})`)
put('settings', await get('/settings/public', { locale }))
put('categories', await get('/categories', { locale }))
const tours = await all('/tours')
put('tours', tours)
for (const t of tours.items) put(`tour.${t.slug}`, await get(`/tours/${t.slug}`, { locale }))
put('regions', await get('/regions', { locale }))
const destinations = await get('/destinations', { locale })
put('destinations', destinations)
for (const d of destinations.items) put(`destination.${d.slug}`, await get(`/destinations/${d.slug}`, { locale }))
put('reviews', await all('/reviews'))
put('reviews-summary', await get('/reviews/summary'))
for (const scope of ['general', 'booking', 'corporate']) put(`faqs.${scope}`, await get('/faqs', { locale, scope }))
put('faqs.all', await get('/faqs', { locale }))
const blog = await all('/blog')
put('blog', blog)
for (const b of blog.items) put(`blog.${b.slug}`, await get(`/blog/${b.slug}`, { locale }))
put('gallery', await get('/gallery', { locale }))
put('availability', await get('/availability'))
put('sitemap-data', await get('/sitemap-data'))

mkdirSync(outDir, { recursive: true })
for (const file of readdirSync(outDir)) if (file.endsWith('.json')) rmSync(path.join(outDir, file))
for (const [key, data] of Object.entries(files))
  writeFileSync(path.join(outDir, `${key}.json`), `${JSON.stringify(data, null, 2)}\n`)
console.log(`[content] wrote ${Object.keys(files).length} files to src/content/`)

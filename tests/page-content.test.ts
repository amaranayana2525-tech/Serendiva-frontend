import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { loadMessages } from '@/i18n/messages'
import {
  LIST_ITEM_KEY,
  applyHidden,
  applyLists,
  applyValues,
  getAtPath,
  messageTokens,
  overrideProblem,
  stringLeaves,
  type JsonObject,
} from '@/lib/page-content/merge'
import { PAGE_CONTENT_PAGES, isUnder, pageGroups } from '@/lib/page-content/registry'
import { listEntries } from '@/lib/page-content/lists'
import { listFromEntry, listProblems, listToOverride } from '@/components/admin/page-content/listState'
import { imagesFrom, imagesPayload, pageSlots } from '@/components/admin/page-content/pageImages'
import { CORPORATE_SERVICE_IMAGES, itemSlot } from '@/lib/page-content/slots'
import type { AdminMediaRef, AdminSettings } from '@/lib/api/types'

const corporate = {
  hero: { title: 'Corporate Expeditions', intro: 'For {name} and teams' },
  testimonial: { badge: 'Verified', quote: 'Great trip', author: 'Someone' },
  rich: 'Pack <em>light</em>',
  nights: '{count, plural, one {# night} other {# nights}}',
  legal: { sections: [{ id: 'a', blocks: [{ type: 'p', text: 'First' }] }] },
} satisfies JsonObject

describe('page-content merge', () => {
  it('replaces strings at dotted paths (including array indexes) without mutating the defaults', () => {
    const out = applyValues(corporate, { 'hero.title': 'Team Retreats', 'legal.sections.0.blocks.0.text': 'Changed' })
    expect(getAtPath(out, 'hero.title')).toBe('Team Retreats')
    expect(getAtPath(out, 'legal.sections.0.blocks.0.text')).toBe('Changed')
    expect(corporate.hero.title).toBe('Corporate Expeditions')
  })

  it('ignores unknown paths, non-string targets and empty texts', () => {
    const onSkip = vi.fn()
    const out = applyValues(corporate, { 'hero.missing': 'x', hero: 'x', 'hero.title': '  ' }, { onSkip })
    expect(out).toEqual(corporate)
    expect(onSkip).toHaveBeenCalledWith('hero.missing', 'unknown path')
    expect(onSkip).toHaveBeenCalledWith('hero', 'not a text')
  })

  it('keeps the default when placeholders or tags change', () => {
    const onSkip = vi.fn()
    const out = applyValues(
      corporate,
      {
        'hero.intro': 'For teams', // {name} removed
        rich: 'Pack <strong>light</strong>', // different tag
        nights: '{count, plural, one {# night} other {# nights}', // unbalanced
      },
      { onSkip },
    )
    expect(out).toEqual(corporate)
    expect(onSkip).toHaveBeenCalledTimes(3)
  })

  it('accepts reworded texts that keep the same placeholders', () => {
    const out = applyValues(corporate, { 'hero.intro': 'Built for {name}', rich: 'Travel <em>light</em>!' })
    expect(getAtPath(out, 'hero.intro')).toBe('Built for {name}')
    expect(getAtPath(out, 'rich')).toBe('Travel <em>light</em>!')
  })

  it('lists placeholder tokens and explains problems', () => {
    expect(messageTokens('Hi {name}, <em>{count, plural, one {#} other {#}}</em>')).toEqual(['</em>', '<em>', '{count}', '{name}'])
    expect(overrideProblem('Hi {name}', 'Hi')).toEqual({ kind: 'missing', tokens: ['{name}'] })
    expect(overrideProblem('Hi', 'Hi {name}')).toEqual({ kind: 'unexpected', tokens: ['{name}'] })
    expect(overrideProblem('Hi', 'Hi }{')).toEqual({ kind: 'braces' })
    expect(overrideProblem('Hi {name}', 'Hello {name}')).toBeNull()
  })

  it('removes hidden sections and ignores hidden paths that do not exist', () => {
    const out = applyHidden(corporate, ['testimonial', 'nope.nothing'])
    expect(out).not.toHaveProperty('testimonial')
    expect(corporate).toHaveProperty('testimonial')
  })

  it('walks every string leaf in document order', () => {
    expect(stringLeaves(corporate.legal, 'legal')).toEqual([
      ['legal.sections.0.id', 'a'],
      ['legal.sections.0.blocks.0.type', 'p'],
      ['legal.sections.0.blocks.0.text', 'First'],
    ])
  })
})

describe('loadMessages with admin overrides', () => {
  it('applies English overrides and hidden sections over the JSON files', async () => {
    const messages = await loadMessages('en', [
      { namespace: 'corporate', locale: 'en', values: { 'hero.title': 'Team Retreats in Sri Lanka' }, hidden: ['testimonial'] },
    ])
    expect(getAtPath(messages.corporate, 'hero.title')).toBe('Team Retreats in Sri Lanka')
    expect(messages.corporate).not.toHaveProperty('testimonial')
    // other namespaces untouched
    expect(getAtPath(messages.home, 'hero.eyebrow')).toBeTypeOf('string')
  })

  it('falls back to the JSON files when there are no overrides', async () => {
    const plain = await loadMessages('en')
    const empty = await loadMessages('en', [])
    expect(empty).toEqual(plain)
  })

  it('keeps English overrides for untranslated namespaces in other locales (they fall back to English)', async () => {
    const messages = await loadMessages('de', [
      { namespace: 'about', locale: 'en', values: { 'hero.title': 'Guiding Ceylon Personally' }, hidden: [] },
    ])
    expect(getAtPath(messages.about, 'hero.title')).toBe('Guiding Ceylon Personally')
  })

  it('translated locale files win over English overrides until a locale override exists', async () => {
    const enOnly = await loadMessages('de', [
      { namespace: 'corporate', locale: 'en', values: { 'hero.title': 'Team Retreats' }, hidden: [] },
    ])
    expect(getAtPath(enOnly.corporate, 'hero.title')).not.toBe('Team Retreats')
    expect(getAtPath(enOnly.corporate, 'hero.title')).toContain('Firmen-Retreats')

    const withDe = await loadMessages('de', [
      { namespace: 'corporate', locale: 'en', values: { 'hero.title': 'Team Retreats' }, hidden: [] },
      { namespace: 'corporate', locale: 'de', values: { 'hero.title': 'Team-Retreats' }, hidden: [] },
    ])
    expect(getAtPath(withDe.corporate, 'hero.title')).toBe('Team-Retreats')
  })
})

describe('page-content registry', () => {
  const load = (ns: string) =>
    JSON.parse(readFileSync(new URL(`../src/messages/en/${ns}.json`, import.meta.url), 'utf8')) as JsonObject

  it('has unique page ids and unique section ids per page', () => {
    const ids = PAGE_CONTENT_PAGES.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const page of PAGE_CONTENT_PAGES) {
      const sections = page.sections.map((s) => s.id)
      expect(new Set(sections).size, page.id).toBe(sections.length)
    }
  })

  it('only points at message paths that exist and hold text', () => {
    for (const page of PAGE_CONTENT_PAGES) {
      const messages = load(page.namespace)
      for (const section of page.sections) {
        for (const path of [...section.paths, ...(section.exclude ?? []), ...(section.hideable ?? [])]) {
          expect(getAtPath(messages, path), `${page.namespace}.${path}`).toBeDefined()
        }
        for (const hidden of section.hideable ?? []) {
          expect(section.paths.some((p) => isUnder(hidden, p)), `${page.id}: ${hidden}`).toBe(true)
        }
      }
      const groups = pageGroups(page, messages)
      for (const section of page.sections) {
        expect(groups.some((g) => g.sectionId === section.id), `${page.id}/${section.id} has no editable text`).toBe(true)
      }
      for (const group of groups) {
        for (const field of group.fields) {
          // never offer structural values (ids, block types, links) as copy
          expect(field.path, page.id).not.toMatch(/\.(id|type|href|tone|icon)$/)
        }
      }
    }
  })

  it('splits long legal documents into one card per section, titled by the section', () => {
    const privacy = PAGE_CONTENT_PAGES.find((p) => p.id === 'privacy')!
    const groups = pageGroups(privacy, load('legal'))
    const sections = groups.filter((g) => g.sectionId === 'sections')
    expect(sections.length).toBeGreaterThan(5)
    expect(sections.every((g) => typeof g.heading === 'string' && g.heading.length > 0)).toBe(true)
    expect(groups.flatMap((g) => g.fields).some((f) => f.path === 'privacy.updated')).toBe(false)
  })

  it('uses only namespaces the API accepts', () => {
    const schemas = readFileSync(
      new URL('../../serendiva-api/src/modules/page-content/page-content.schemas.ts', import.meta.url),
      'utf8',
    )
    const block = schemas.match(/PAGE_CONTENT_NAMESPACES = \[([\s\S]*?)\]/)?.[1] ?? ''
    const allowed = [...block.matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1])
    for (const page of PAGE_CONTENT_PAGES) expect(allowed, page.id).toContain(page.namespace)
  })
})

describe('editable lists', () => {
  const load = (ns: string) =>
    JSON.parse(readFileSync(new URL(`../src/messages/en/${ns}.json`, import.meta.url), 'utf8')) as JsonObject

  const messages = {
    services: {
      title: 'Services',
      label: 'Our services',
      items: {
        board: { title: 'Board retreats', body: 'For {name}', points: { one: 'A', two: 'B' } },
        summit: { title: 'Summits', body: 'Big events', points: { one: 'C', two: 'D' } },
      },
    },
  } satisfies JsonObject

  it('rebuilds a list in the given order, removes missing items and adds new ones', () => {
    const out = applyLists(messages, {
      'services.items': [
        { key: 'summit', values: {} },
        { key: 'gala', values: { title: 'Gala dinners', body: 'Oceanfront', 'points.one': 'E', icon: 'celebration' } },
      ],
    })
    const items = getAtPath(out, 'services.items') as JsonObject
    expect(Object.keys(items)).toEqual(['summit', 'gala'])
    expect(items.summit).toEqual(messages.services.items.summit)
    expect(items.gala).toEqual({ title: 'Gala dinners', body: 'Oceanfront', points: { one: 'E', two: '' }, icon: 'celebration' })
    expect(messages.services.items).toHaveProperty('board')
  })

  it('keeps the texts of built-in items, rejects unknown fields, bad keys and invented placeholders', () => {
    const onSkip = vi.fn()
    const out = applyLists(
      messages,
      {
        'services.items': [
          { key: 'board', values: { body: 'Only for teams', nope: 'x' } }, // drops {name} → kept default
          { key: '1', values: { title: 'numeric key' } },
          { key: 'board', values: {} }, // duplicate
          { key: 'fresh', values: { title: 'Hi {who}', body: 'Fine' } },
        ],
      },
      { onSkip },
    )
    const items = getAtPath(out, 'services.items') as JsonObject
    expect(Object.keys(items)).toEqual(['board', 'fresh'])
    expect(getAtPath(items, 'board.body')).toBe('For {name}')
    expect(getAtPath(items, 'fresh.title')).toBe('')
    expect(getAtPath(items, 'fresh.body')).toBe('Fine')
    expect(onSkip).toHaveBeenCalledTimes(5)
  })

  it('keeps plain-text siblings of the items and ignores paths that are not lists', () => {
    const out = applyLists(messages, { services: [{ key: 'x', values: {} }], 'services.title': [] })
    expect(getAtPath(out, 'services.title')).toBe('Services')
    const items = applyLists(messages.services as JsonObject, { items: [] })
    expect(getAtPath(items, 'items')).toEqual({})
    expect(getAtPath(items, 'label')).toBe('Our services')
  })

  it('lists entries for components with their presentation matched by key (new items cycle)', () => {
    const metas = [
      { key: 'board', icon: 'lock', tone: 'a' },
      { key: 'summit', icon: 'event', tone: 'b' },
    ] as const
    const raw = { summit: { title: 'S' }, gala: { title: 'G', icon: 'celebration' }, extra: { title: 'E' }, label: 'x' }
    expect(listEntries(raw, metas).map((e) => [e.key, e.meta.tone, e.icon, e.known])).toEqual([
      ['summit', 'b', 'event', true],
      ['gala', 'b', 'celebration', false],
      ['extra', 'a', 'lock', false],
    ])
    expect(listEntries(undefined, metas)).toEqual([])
  })

  it('editor state round-trips: defaults → no override; edits → items with changed texts only', () => {
    const page = PAGE_CONTENT_PAGES.find((p) => p.id === 'corporate')!
    const model = pageGroups(page, load('corporate')).find((g) => g.list?.path === 'process.steps')!.list!
    const items = listFromEntry(model, undefined)
    expect(listToOverride(model, items)).toBeNull()

    const reordered = [items[1]!, items[0]!, ...items.slice(2)]
    const override = listToOverride(model, reordered)!
    expect(override.map((i) => i.key)).toEqual(reordered.map((i) => i.key))
    expect(override.every((i) => Object.keys(i.values).length === 0)).toBe(true)

    const added = [...items, { key: 'itemx', values: { title: 'Aftercare', body: '', phase: 'Phase 05' }, icon: 'favorite', isNew: true }]
    expect(Object.values(listProblems(model, added))).toEqual([{ kind: 'required' }])
    const stored = listToOverride(model, added)!
    expect(stored.at(-1)).toEqual({ key: 'itemx', values: { title: 'Aftercare', phase: 'Phase 05', icon: 'favorite' } })
    // and back
    expect(listFromEntry(model, { values: {}, lists: { 'process.steps': stored } }).at(-1)).toEqual({
      key: 'itemx',
      values: { title: 'Aftercare', body: '', phase: 'Phase 05' },
      icon: 'favorite',
      isNew: true,
    })
  })

  it('every registry list points at a keyed list inside its section, and its items are not plain fields', () => {
    for (const page of PAGE_CONTENT_PAGES) {
      const messages = load(page.namespace)
      for (const group of pageGroups(page, messages)) {
        if (!group.list) continue
        expect(group.list.defaults.length, `${page.id}: ${group.list.path}`).toBeGreaterThan(0)
        expect(group.roots.some((r) => isUnder(group.list!.path, r)), `${page.id}: ${group.list.path}`).toBe(true)
        for (const d of group.list.defaults) {
          expect(LIST_ITEM_KEY.test(d.key), `${page.id}: key ${d.key}`).toBe(true)
          expect(group.fields.some((f) => isUnder(f.path, `${group.list!.path}.${d.key}`))).toBe(false)
        }
      }
    }
  })

  it('reviews and travel guide FAQs are no longer edited as page text', () => {
    for (const id of ['reviews', 'travelGuide']) {
      const page = PAGE_CONTENT_PAGES.find((p) => p.id === id)!
      const fields = pageGroups(page, load(page.namespace)).flatMap((g) => g.fields)
      expect(fields.some((f) => f.path.startsWith('faq.items'))).toBe(false)
      expect(fields.some((f) => f.path === 'faq.title')).toBe(true)
    }
  })

  it('loadMessages applies English lists after the locale files', async () => {
    const messages = await loadMessages('de', [
      { namespace: 'corporate', locale: 'en', values: {}, hidden: [], lists: { 'process.steps': [{ key: 'execution', values: {} }] } },
    ])
    expect(Object.keys(getAtPath(messages.corporate, 'process.steps') as JsonObject)).toEqual(['execution'])
  })
})

describe('page photos', () => {
  const load = (ns: string) =>
    JSON.parse(readFileSync(new URL(`../src/messages/en/${ns}.json`, import.meta.url), 'utf8')) as JsonObject
  const ref = (id: string) => ({ id, url: `/u/${id}.webp`, alt: '', width: null, height: null }) as unknown as AdminMediaRef
  const corporate = PAGE_CONTENT_PAGES.find((p) => p.id === 'corporate')!
  const groups = pageGroups(corporate, load('corporate'))
  const settingsWith = (pageImages: { slot: string; imageId: string }[]) =>
    ({ pageImages, mediaRefs: Object.fromEntries(pageImages.map((p) => [p.imageId, ref(p.imageId)])) }) as unknown as AdminSettings

  it('derives item slots: built-in items keep theirs, new ones get prefix-key', () => {
    expect(itemSlot(CORPORATE_SERVICE_IMAGES, 'board')).toBe('corp-board-retreat-bawa-villa')
    expect(itemSlot(CORPORATE_SERVICE_IMAGES, 'itemAb_1')).toBe('corp-service-itemab-1')
    // every built-in service/blueprint has a slot
    for (const g of groups) {
      if (!g.list?.image) continue
      for (const d of g.list.defaults) expect(g.list.image.slots[d.key], d.key).toBeDefined()
    }
  })

  it('lists the corporate photos: hero, testimonial, 6 services and 3 blueprints', () => {
    const lists = Object.fromEntries(groups.flatMap((g) => (g.list ? [[g.list.path, listFromEntry(g.list, undefined)]] : [])))
    const slots = pageSlots(groups, lists)
    expect(slots).toEqual(
      expect.arrayContaining(['corp-hero-boardroom-tea-estate', 'corp-testimonial-portrait', 'corp-gala-oceanfront', 'corp-blueprint-yala-glamping']),
    )
    expect(slots).toHaveLength(11)
  })

  it('PUTs only touched slots, keeps the rest, and cleans up photos of removed new items', () => {
    const settings = settingsWith([
      { slot: 'corp-hero-boardroom-tea-estate', imageId: 'hero1' },
      { slot: 'corp-gala-oceanfront', imageId: 'gala1' },
      { slot: 'corp-service-itemold', imageId: 'old1' }, // photo of a new item that was removed since
      { slot: 'home-hero', imageId: 'h1' },
    ])
    const lists = Object.fromEntries(groups.flatMap((g) => (g.list ? [[g.list.path, listFromEntry(g.list, undefined)]] : [])))
    const baseline = imagesFrom(settings, pageSlots(groups, lists))
    expect(imagesPayload(settings, baseline, baseline, groups, lists)).toEqual([
      { slot: 'corp-hero-boardroom-tea-estate', imageId: 'hero1' },
      { slot: 'corp-gala-oceanfront', imageId: 'gala1' },
      { slot: 'home-hero', imageId: 'h1' },
    ])

    const services = [...lists['services.items']!, { key: 'itemnew', values: {}, icon: null, isNew: true }]
    const nextLists = { ...lists, 'services.items': services }
    const current = { ...baseline, 'corp-hero-boardroom-tea-estate': ref('hero2'), 'corp-service-itemnew': ref('new1'), 'corp-gala-oceanfront': null }
    expect(imagesPayload(settings, baseline, current, groups, nextLists)).toEqual([
      { slot: 'home-hero', imageId: 'h1' },
      { slot: 'corp-hero-boardroom-tea-estate', imageId: 'hero2' },
      { slot: 'corp-service-itemnew', imageId: 'new1' },
    ])
  })
})

/**
 * Which parts of the static page copy (src/messages/en/<namespace>.json) the admin can edit in
 * /admin/page-content. Only marketing/content copy is listed — form labels, buttons, aria labels,
 * validation and empty-state UI stay in the translation files.
 *
 * A section lists one or more message paths (relative to the namespace); every string under them becomes
 * a field, except paths under `exclude`. `hideable` paths get a "Show" switch: when off, the subtree is
 * removed from the messages and the component renders nothing (it checks `t.has()`).
 *
 * Namespaces must also be allowed by the API (serendiva-api/src/modules/page-content/page-content.schemas.ts).
 */

import { getAtPath, listChildren, stringLeaves, type JsonObject, type JsonValue } from './merge'
import { CORPORATE_BLUEPRINT_IMAGES, CORPORATE_SERVICE_IMAGES, type ListImageSlots } from './slots'

export type PageContentNamespace =
  | 'common'
  | 'home'
  | 'about'
  | 'blog'
  | 'contact'
  | 'corporate'
  | 'destinations'
  | 'destinationDetail'
  | 'gallery'
  | 'legal'
  | 'responsible'
  | 'reviews'
  | 'tours'
  | 'tourDetail'
  | 'travelGuide'
  | 'quiz'

export interface PageContentSection {
  /** Stable id (DOM ids, React keys). */
  id: string
  paths: readonly string[]
  exclude?: readonly string[]
  hideable?: readonly string[]
  /** One card per child of the (single) path, titled by the child's `title` — used for long documents. */
  each?: boolean
  /** An editable list inside the section (re-order, remove, restore, and — when `addable` — add items). */
  list?: PageContentListConfig
  /** Photos shown in this section (settings.pageImages slots), edited in the same card. */
  images?: readonly PageImageSlot[]
}

export interface PageImageSlot {
  slot: string
  aspect?: 'landscape' | 'video' | 'square' | 'portrait'
}

export interface PageContentListConfig {
  /** Message object whose object children are the items (`services.items`). */
  path: string
  /** New items allowed. False for items tied to a photo slot or other built-in data. */
  addable: boolean
  /** Items can pick their own icon. */
  icon?: boolean
  /** Default 12. */
  max?: number
  /** One photo per item (settings.pageImages); new items get their own slot. */
  image?: ListImageSlots
}

export interface PageContentPage {
  /** URL key (`?page=`) and `adminContent.pageContent.pages.<id>` label. */
  id: string
  namespace: PageContentNamespace
  /** Public URL for "View page" (templates point to the list page). */
  href: string
  icon: string
  sections: readonly PageContentSection[]
}

const seo = (prefix = 'meta'): PageContentSection => ({ id: 'seo', paths: [prefix] })

/** Privacy / terms: the document header, then one card per legal section (`sections[]`). */
function legalSections(doc: 'privacy' | 'terms'): PageContentSection[] {
  return [
    // `updated` is an ISO date the page formats — not free text.
    { id: 'intro', paths: [doc], exclude: [`${doc}.meta`, `${doc}.breadcrumb`, `${doc}.sections`, `${doc}.updated`] },
    { id: 'sections', paths: [`${doc}.sections`], each: true },
    seo(`${doc}.meta`),
  ]
}

export const PAGE_CONTENT_PAGES: readonly PageContentPage[] = [
  {
    id: 'home',
    namespace: 'home',
    href: '/',
    icon: 'home',
    sections: [
      { id: 'hero', paths: ['hero'], exclude: ['hero.inquiry', 'hero.slides', 'hero.slidePicker', 'hero.scrollCue'] },
      { id: 'trust', paths: ['trust'], exclude: ['trust.label'] },
      { id: 'guide', paths: ['guide'], list: { path: 'guide.pillars', addable: true, icon: true } },
      { id: 'categories', paths: ['categories'] },
      { id: 'featured', paths: ['featured'] },
      { id: 'craft', paths: ['craft'], hideable: ['craft.quote'], list: { path: 'craft.steps', addable: true } },
      { id: 'destinations', paths: ['destinations'] },
      {
        id: 'corporate',
        paths: ['corporate'],
        list: { path: 'corporate.features', addable: true, icon: true },
        images: [{ slot: 'corp-home-veranda-meeting', aspect: 'landscape' }],
      },
      { id: 'reviews', paths: ['reviews'], exclude: ['reviews.carouselLabel'] },
      { id: 'responsible', paths: ['responsible'], list: { path: 'responsible.pillars', addable: true } },
      { id: 'climate', paths: ['climate'] },
      { id: 'stories', paths: ['stories'], exclude: ['stories.instagramLabel'] },
      seo(),
    ],
  },
  {
    id: 'about',
    namespace: 'about',
    href: '/about',
    icon: 'person',
    sections: [
      { id: 'hero', paths: ['hero'] },
      { id: 'metrics', paths: ['metrics'], exclude: ['metrics.label'] },
      { id: 'story', paths: ['story'], hideable: ['story.quote'] },
      { id: 'video', paths: ['video'], exclude: ['video.play', 'video.frameTitle', 'video.audio', 'video.subtitles'] },
      { id: 'pillars', paths: ['pillars'], list: { path: 'pillars.items', addable: true, icon: true } },
      { id: 'credentials', paths: ['credentials'] },
      { id: 'languages', paths: ['languages'] },
      { id: 'fleet', paths: ['fleet'] },
      { id: 'travelers', paths: ['travelers'], list: { path: 'travelers.items', addable: true, icon: true } },
      { id: 'endorsement', paths: ['endorsement'] },
      { id: 'cta', paths: ['cta'] },
      { id: 'seo', paths: ['meta', 'jsonLd'] },
    ],
  },
  {
    id: 'tours',
    namespace: 'tours',
    href: '/tours',
    icon: 'map',
    sections: [
      { id: 'hero', paths: ['hero'] },
      { id: 'stats', paths: ['stats'], exclude: ['stats.label'], list: { path: 'stats', addable: true, icon: true } },
      { id: 'custom', paths: ['custom'] },
      { id: 'faq', paths: ['faq'] },
      { id: 'cta', paths: ['cta'] },
      seo(),
    ],
  },
  {
    id: 'tourDetail',
    namespace: 'tourDetail',
    href: '/tours',
    icon: 'route',
    sections: [
      { id: 'overview', paths: ['overview.kicker', 'overview.curatedBy', 'overview.featuresLabel'] },
      { id: 'itinerary', paths: ['itinerary.eyebrow', 'itinerary.title'] },
      { id: 'inclusions', paths: ['inclusions'] },
      { id: 'route', paths: ['route.eyebrow', 'route.title'] },
      { id: 'faq', paths: ['faq'] },
      { id: 'reviews', paths: ['reviews.eyebrow', 'reviews.title'] },
      { id: 'related', paths: ['related.eyebrow', 'related.title'] },
    ],
  },
  {
    id: 'destinations',
    namespace: 'destinations',
    href: '/destinations',
    icon: 'location_on',
    sections: [
      { id: 'hero', paths: ['hero'] },
      { id: 'curations', paths: ['curations.eyebrow', 'curations.title'] },
      { id: 'season', paths: ['season'] },
      { id: 'insight', paths: ['insight'], hideable: ['insight'] },
      { id: 'quiz', paths: ['quiz'] },
      { id: 'faq', paths: ['faq'] },
      seo(),
    ],
  },
  {
    id: 'destinationDetail',
    namespace: 'destinationDetail',
    href: '/destinations',
    icon: 'landscape',
    sections: [
      { id: 'guide', paths: ['guide'], exclude: ['guide.perksLabel'] },
      { id: 'experiences', paths: ['experiences'] },
      { id: 'stays', paths: ['stays'] },
      { id: 'fieldNotes', paths: ['fieldNotes'] },
      { id: 'faq', paths: ['faq'] },
      {
        id: 'inquiry',
        paths: ['inquiry.eyebrow', 'inquiry.title', 'inquiry.intro', 'inquiry.introNoGuide', 'inquiry.trust', 'inquiry.successTitle', 'inquiry.successBody'],
      },
      { id: 'journeys', paths: ['journeys.eyebrow', 'journeys.title', 'journeys.intro', 'journeys.footer'] },
      { id: 'connections', paths: ['connections.eyebrow', 'connections.title', 'connections.intro'] },
    ],
  },
  {
    id: 'corporate',
    namespace: 'corporate',
    href: '/corporate',
    icon: 'business_center',
    sections: [
      {
        id: 'hero',
        paths: ['hero'],
        exclude: ['hero.statsLabel'],
        list: { path: 'hero.stats', addable: true },
        images: [{ slot: 'corp-hero-boardroom-tea-estate', aspect: 'video' }],
      },
      { id: 'clients', paths: ['clients'], exclude: ['clients.listLabel'] },
      {
        id: 'services',
        paths: ['services'],
        list: { path: 'services.items', addable: true, icon: true, image: CORPORATE_SERVICE_IMAGES },
      },
      { id: 'process', paths: ['process'], list: { path: 'process.steps', addable: true, icon: true } },
      { id: 'governance', paths: ['governance'], list: { path: 'governance.pillars', addable: true, icon: true } },
      // Blueprints can't grow: each one's length (nights) is part of the page code.
      { id: 'blueprints', paths: ['blueprints'], list: { path: 'blueprints.items', addable: false, image: CORPORATE_BLUEPRINT_IMAGES } },
      {
        id: 'testimonial',
        paths: ['testimonial'],
        hideable: ['testimonial'],
        images: [{ slot: 'corp-testimonial-portrait', aspect: 'portrait' }],
      },
      { id: 'rfp', paths: ['rfp.eyebrow', 'rfp.title', 'rfp.intro', 'rfp.desk', 'rfp.success'] },
      { id: 'faq', paths: ['faq'] },
      { id: 'finalCta', paths: ['finalCta'] },
      seo(),
    ],
  },
  {
    id: 'gallery',
    namespace: 'gallery',
    href: '/gallery',
    icon: 'photo_library',
    sections: [
      { id: 'hero', paths: ['hero'] },
      { id: 'quote', paths: ['quote'] },
      { id: 'videos', paths: ['videos.eyebrow', 'videos.title', 'videos.intro', 'videos.badge'] },
      { id: 'instagram', paths: ['instagram.eyebrow', 'instagram.title', 'instagram.titleNoHandle', 'instagram.explore'] },
      { id: 'cta', paths: ['cta'] },
      seo(),
    ],
  },
  {
    id: 'reviews',
    namespace: 'reviews',
    href: '/reviews',
    icon: 'reviews',
    sections: [
      { id: 'hero', paths: ['hero'] },
      { id: 'score', paths: ['score.body', 'score.badges'] },
      { id: 'grid', paths: ['grid.eyebrow', 'grid.title', 'grid.intro'] },
      { id: 'videos', paths: ['videos.eyebrow', 'videos.title', 'videos.intro'] },
      { id: 'share', paths: ['share'] },
      // The questions themselves are edited in FAQs (scope “Reviews page”).
      { id: 'faq', paths: ['faq'], exclude: ['faq.items'] },
      { id: 'cta', paths: ['cta'] },
      { id: 'shareForm', paths: ['form.hero', 'form.aside'] },
      { id: 'seo', paths: ['meta'] },
    ],
  },
  {
    id: 'blog',
    namespace: 'blog',
    href: '/blog',
    icon: 'article',
    sections: [
      { id: 'header', paths: ['header'] },
      { id: 'featured', paths: ['featured.noteLabel', 'featured.note'] },
      { id: 'newsletter', paths: ['newsletter'] },
      { id: 'spotlight', paths: ['spotlight'], hideable: ['spotlight'] },
      { id: 'finalCta', paths: ['finalCta'] },
      seo(),
    ],
  },
  {
    id: 'contact',
    namespace: 'contact',
    href: '/contact',
    icon: 'contact_mail',
    sections: [
      { id: 'hero', paths: ['hero'] },
      { id: 'trust', paths: ['trust'] },
      { id: 'concierge', paths: ['concierge.quote', 'concierge.bullets', 'concierge.hours', 'concierge.base', 'concierge.photoQuote'] },
      { id: 'process', paths: ['process'], list: { path: 'process.steps', addable: true, icon: true } },
      { id: 'coverage', paths: ['coverage.eyebrow', 'coverage.title', 'coverage.body', 'coverage.features', 'coverage.mapEyebrow', 'coverage.mapTitle'] },
      { id: 'faq', paths: ['faq'] },
      seo(),
    ],
  },
  {
    id: 'travelGuide',
    namespace: 'travelGuide',
    href: '/travel-guide',
    icon: 'menu_book',
    sections: [
      { id: 'hero', paths: ['hero'] },
      { id: 'curator', paths: ['curator'] },
      { id: 'advice', paths: ['advice'] },
      { id: 'visa', paths: ['visa'] },
      { id: 'bestTime', paths: ['bestTime'] },
      { id: 'etiquette', paths: ['etiquette'], hideable: ['etiquette.quote'] },
      { id: 'packing', paths: ['packing'] },
      { id: 'gettingAround', paths: ['gettingAround'] },
      { id: 'money', paths: ['money'] },
      { id: 'health', paths: ['health'] },
      { id: 'connectivity', paths: ['connectivity'] },
      { id: 'festivals', paths: ['festivals'] },
      { id: 'safety', paths: ['safety'] },
      // The questions themselves are edited in FAQs (scope “Travel guide”).
      { id: 'faq', paths: ['faq'], exclude: ['faq.items'] },
      { id: 'cta', paths: ['cta'] },
      seo(),
    ],
  },
  {
    id: 'responsible',
    namespace: 'responsible',
    href: '/responsible-travel',
    icon: 'eco',
    sections: [
      { id: 'hero', paths: ['hero'], list: { path: 'hero.stats', addable: true, icon: true } },
      { id: 'pillars', paths: ['pillars'], list: { path: 'pillars.items', addable: true, icon: true } },
      { id: 'checklist', paths: ['checklist'], exclude: ['checklist.progress', 'checklist.reset'] },
      { id: 'partnerships', paths: ['partnerships'] },
      { id: 'credentials', paths: ['credentials'], list: { path: 'credentials.items', addable: true, icon: true } },
      { id: 'creed', paths: ['creed'], hideable: ['creed'] },
      { id: 'cta', paths: ['cta'] },
      seo(),
    ],
  },
  {
    id: 'quiz',
    namespace: 'quiz',
    href: '/trip-quiz',
    icon: 'quiz',
    sections: [
      { id: 'hero', paths: ['hero'], exclude: ['hero.trustLabel'] },
      { id: 'process', paths: ['process'], list: { path: 'process.steps', addable: true } },
      { id: 'results', paths: ['results.badge', 'results.title', 'results.intro', 'results.guide', 'results.quote'] },
      { id: 'banner', paths: ['banner'], exclude: ['banner.page'] },
      seo(),
    ],
  },
  {
    id: 'privacy',
    namespace: 'legal',
    href: '/privacy',
    icon: 'shield',
    sections: legalSections('privacy'),
  },
  {
    id: 'terms',
    namespace: 'legal',
    href: '/terms',
    icon: 'gavel',
    sections: legalSections('terms'),
  },
  {
    id: 'siteWide',
    namespace: 'common',
    href: '/',
    icon: 'public',
    sections: [
      { id: 'brand', paths: ['brand.tagline'] },
      { id: 'finalCta', paths: ['finalCta'] },
      { id: 'inquiryCard', paths: ['inquiryCard'] },
      {
        id: 'footer',
        paths: ['footer.about', 'footer.expeditionsTitle', 'footer.expeditions', 'footer.conciergeTitle', 'footer.concierge', 'footer.newsletterTitle', 'footer.newsletterIntro'],
      },
      { id: 'notFound', paths: ['notFound'], exclude: ['notFound.metaTitle'] },
      { id: 'seo', paths: ['meta.titleTemplate', 'meta.defaultTitle', 'meta.defaultDescription'] },
    ],
  },
]

/** Does `path` equal `prefix` or lie below it? */
export const isUnder = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}.`)

export function pageById(id: string | null | undefined): PageContentPage | undefined {
  return PAGE_CONTENT_PAGES.find((p) => p.id === id)
}

/** Leaf keys that hold structure (ids, block types, links, colour tones), never copy. */
const STRUCTURAL_KEYS = new Set(['id', 'type', 'href', 'tone', 'icon', 'slot'])

export interface PageContentField {
  /** Message path inside the namespace (also the override key). */
  path: string
  /** Default (JSON) text. */
  text: string
}

export interface PageContentGroup {
  /** Unique within the page. */
  key: string
  sectionId: string
  /** Heading taken from the content itself (legal sections); otherwise the section label is used. */
  heading?: string
  /** Paths the field labels are relative to. */
  roots: readonly string[]
  fields: PageContentField[]
  hideable: readonly string[]
  list?: PageContentListModel
  images?: readonly PageImageSlot[]
}

/** An editable list with its default items (from the JSON). */
export interface PageContentListModel extends PageContentListConfig {
  max: number
  /** Field paths inside an item, from the first default item (the shape new items get). */
  fields: string[]
  defaults: { key: string; texts: Record<string, string> }[]
}

const isRecord = (v: unknown): v is Record<string, JsonValue> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The editable fields of one section: every text under its paths, minus excluded and structural keys. */
export function sectionFields(messages: JsonObject, paths: readonly string[], exclude: readonly string[] = []): PageContentField[] {
  return paths
    .flatMap((p) => stringLeaves(getAtPath(messages, p), p))
    .filter(([path]) => !exclude.some((ex) => isUnder(path, ex)))
    .filter(([path]) => !STRUCTURAL_KEYS.has(path.slice(path.lastIndexOf('.') + 1)))
    .map(([path, text]) => ({ path, text }))
}

/** The default items of a list section (empty when the path holds no object children). */
export function listModel(messages: JsonObject, config: PageContentListConfig): PageContentListModel {
  const defaults = listChildren(getAtPath(messages, config.path)).map(([key, item]) => ({
    key,
    texts: Object.fromEntries(
      stringLeaves(item).filter(([field]) => !STRUCTURAL_KEYS.has(field.slice(field.lastIndexOf('.') + 1))),
    ),
  }))
  return { ...config, max: config.max ?? 12, fields: Object.keys(defaults[0]?.texts ?? {}), defaults }
}

/** Cards for a page: one per section, or one per child for `each` sections. Empty groups are dropped. */
export function pageGroups(page: PageContentPage, messages: JsonObject): PageContentGroup[] {
  return page.sections.flatMap((section): PageContentGroup[] => {
    if (!section.each) {
      const list = section.list ? listModel(messages, section.list) : undefined
      const itemRoots = list?.defaults.map((d) => `${list.path}.${d.key}`) ?? []
      return [
        {
          key: section.id,
          sectionId: section.id,
          roots: section.paths,
          fields: sectionFields(messages, section.paths, [...(section.exclude ?? []), ...itemRoots]),
          hideable: section.hideable ?? [],
          list,
          images: section.images,
        },
      ]
    }
    const root = section.paths[0] ?? ''
    const node = getAtPath(messages, root)
    const children = Array.isArray(node) ? node.map((v, i) => [String(i), v] as const) : isRecord(node) ? Object.entries(node) : []
    return children.map(([key, child]) => ({
      key: `${section.id}.${key}`,
      sectionId: section.id,
      heading: isRecord(child) && typeof child.title === 'string' ? child.title : undefined,
      roots: [`${root}.${key}`],
      fields: sectionFields(messages, [`${root}.${key}`], section.exclude),
      hideable: [],
    }))
  }).filter((g) => g.fields.length > 0 || g.hideable.length > 0 || Boolean(g.list?.defaults.length) || Boolean(g.images?.length))
}

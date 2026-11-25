import type { PublicSettings } from '@/lib/api/types'

/*
 * Legal documents (privacy policy, terms) are structured content in src/messages/<locale>/legal.json so they can be
 * translated like any other page text. Strings may contain:
 *   {placeholders}   business details filled from the CMS settings (see LegalPlaceholders)
 *   **bold**         strong emphasis
 *   [label](/path)   internal link (or https://… external link)
 */

export type LegalKind = 'privacy' | 'terms'

export type LegalListItem = string | { term: string; text: string }

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: LegalListItem[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'callout'; title: string; text: string; tone?: 'info' | 'warning' }
  | { type: 'contact' }

export interface LegalSection {
  id: string
  /** Table-of-contents label. */
  short: string
  kicker: string
  title: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  meta: { title: string; description: string }
  breadcrumb: string
  badge: string
  title: string
  titleAccent: string
  intro: string
  /** ISO date (YYYY-MM-DD) of the current version. */
  updated: string
  help: { title: string; body: string }
  related: { label: string; href: string }
  glance: { label: string; value: string; text: string }[]
  sections: LegalSection[]
}

export interface LegalPlaceholders {
  businessName: string
  guideName: string
  address: string
  email: string
  whatsapp: string
  guideLicence: string
  operatorLicence: string
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Light structural check so a broken translation file degrades to an error state instead of a crash. */
export function isLegalDocument(value: unknown): value is LegalDocument {
  if (!isObject(value)) return false
  const { sections, glance, meta, help, related } = value
  return (
    typeof value.title === 'string' &&
    typeof value.updated === 'string' &&
    isObject(meta) &&
    isObject(help) &&
    isObject(related) &&
    Array.isArray(glance) &&
    Array.isArray(sections) &&
    sections.every(
      (s) => isObject(s) && typeof s.id === 'string' && typeof s.title === 'string' && Array.isArray(s.blocks),
    )
  )
}

/** Picks one document out of the `legal` messages namespace. */
export function getLegalDocument(legalMessages: unknown, kind: LegalKind): LegalDocument | null {
  if (!isObject(legalMessages)) return null
  const doc = legalMessages[kind]
  return isLegalDocument(doc) ? doc : null
}

/** Business details for the {placeholders}: CMS settings first, message defaults as fallback. */
export function legalPlaceholders(settings: PublicSettings | null, defaults: LegalPlaceholders): LegalPlaceholders {
  if (!settings) return defaults
  const { contact, guide, seo } = settings
  return {
    businessName: defaults.businessName || seo.siteName,
    guideName: guide.name || defaults.guideName,
    address: contact.address || defaults.address,
    email: contact.email || defaults.email,
    whatsapp: contact.whatsappDisplay || defaults.whatsapp,
    guideLicence: guide.licenseNumber || defaults.guideLicence,
    operatorLicence: guide.operatorLicense || defaults.operatorLicence,
  }
}

/** Replaces {placeholders}; unknown names are left untouched. */
export function fillPlaceholders(text: string, values: LegalPlaceholders): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key as keyof LegalPlaceholders] : match,
  )
}

export type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'strong'; value: string }
  | { kind: 'link'; label: string; href: string }
  | { kind: 'email'; value: string }

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi

/** Splits a (placeholder-filled) string into text / **bold** / [link](href) / email tokens. */
export function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    if (index > last) tokens.push({ kind: 'text', value: text.slice(last, index) })
    if (match[1] !== undefined) tokens.push({ kind: 'strong', value: match[1] })
    else if (match[2] !== undefined && match[3] !== undefined)
      tokens.push({ kind: 'link', label: match[2], href: match[3] })
    else if (match[4] !== undefined) tokens.push({ kind: 'email', value: match[4] })
    last = index + match[0].length
  }
  if (last < text.length) tokens.push({ kind: 'text', value: text.slice(last) })
  return tokens
}

/** Icons per section id (kept in code so the sprite builder picks them up). */
export const LEGAL_SECTION_ICONS: Record<string, { icon: string }> = {
  'who-i-am': { icon: 'badge' },
  'what-i-collect': { icon: 'inventory_2' },
  purposes: { icon: 'fact_check' },
  sharing: { icon: 'share' },
  transfers: { icon: 'public' },
  retention: { icon: 'schedule' },
  cookies: { icon: 'cookie' },
  'your-rights': { icon: 'verified_user' },
  security: { icon: 'lock' },
  children: { icon: 'family_restroom' },
  changes: { icon: 'update' },
  contact: { icon: 'mail' },
  about: { icon: 'badge' },
  website: { icon: 'language' },
  proposals: { icon: 'edit_note' },
  agreement: { icon: 'handshake' },
  payments: { icon: 'credit_card_off' },
  'changes-cancellations': { icon: 'event_repeat' },
  'third-parties': { icon: 'hotel' },
  'your-responsibilities': { icon: 'luggage' },
  safety: { icon: 'health_and_safety' },
  liability: { icon: 'balance' },
  licences: { icon: 'workspace_premium' },
  content: { icon: 'photo_library' },
  complaints: { icon: 'support_agent' },
  law: { icon: 'gavel' },
}

export const DEFAULT_SECTION_ICON = { icon: 'article' }
